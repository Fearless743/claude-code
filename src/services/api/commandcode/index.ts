/**
 * Command Code provider query path.
 *
 * Command Code uses a proprietary NDJSON API with custom envelope format.
 * This module converts Anthropic-format inputs to CC format, sends the
 * request, and adapts the NDJSON stream back to Anthropic stream events.
 */

import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type { SystemPrompt } from '../../../utils/systemPromptType.js'
import type {
  Message,
  StreamEvent,
  SystemAPIErrorMessage,
  AssistantMessage,
} from '../../../types/message.js'
import type { Tools } from '../../../Tool.js'
import { randomUUID } from 'crypto'
import { normalizeMessagesForAPI } from '../../../utils/messages.js'
import { toolToAPISchema } from '../../../utils/api.js'
import { logForDebugging } from '../../../utils/debug.js'
import { addToTotalSessionCost } from '../../../cost-tracker.js'
import { calculateUSDCost } from '../../../utils/modelCost.js'
import { recordLLMObservation } from '../../../services/langfuse/tracing.js'
import {
  convertMessagesToLangfuse,
  convertOutputToLangfuse,
  convertToolsToLangfuse,
} from '../../../services/langfuse/convert.js'
import type { Options } from '../claude.js'
import {
  createAssistantAPIErrorMessage,
  normalizeContentFromAPI,
} from '../../../utils/messages.js'
import type { SDKAssistantMessageError } from '../../../entrypoints/agentSdkTypes.js'
import { resolveCommandCodeModel } from './models.js'
import { buildCommandCodeRequest } from './convertRequest.js'
import { streamCommandCodeRequest } from './client.js'
import { adaptCommandCodeStreamToAnthropic } from './streamAdapter.js'

/**
 * Command Code query path. CC uses a proprietary NDJSON API, so we have
 * custom request conversion and stream adaptation (not OpenAI-compatible).
 */
export async function* queryModelCommandCode(
  messages: Message[],
  systemPrompt: SystemPrompt,
  tools: Tools,
  signal: AbortSignal,
  options: Options,
): AsyncGenerator<
  StreamEvent | AssistantMessage | SystemAPIErrorMessage,
  void
> {
  try {
    const ccModel = resolveCommandCodeModel(options.model)
    const messagesForAPI = normalizeMessagesForAPI(messages, tools)

    const toolSchemas = await Promise.all(
      tools.map(tool =>
        toolToAPISchema(tool, {
          getToolPermissionContext: options.getToolPermissionContext,
          tools,
          agents: options.agents,
          allowedAgentTypes: options.allowedAgentTypes,
          model: options.model,
        }),
      ),
    )

    const threadId = randomUUID()

    logForDebugging(
      `[CommandCode] Calling model=${ccModel}, messages=${messagesForAPI.length}, tools=${toolSchemas.length}`,
    )

    const ccBody = buildCommandCodeRequest({
      model: ccModel,
      messages: messagesForAPI,
      systemPrompt,
      tools: toolSchemas as BetaToolUnion[],
      maxTokens: options.maxOutputTokensOverride || 64000,
      temperature: options.temperatureOverride,
      threadId,
    })

    const stream = await streamCommandCodeRequest({
      body: ccBody,
      signal,
      fetchOverride: options.fetchOverride as typeof fetch | undefined,
    })

    const adaptedStream = adaptCommandCodeStreamToAnthropic(stream, ccModel)

    // Track content blocks per index (like Grok does)
    const contentBlocks: Record<number, any> = {}
    const collectedMessages: AssistantMessage[] = []
    let partialMessage: Record<string, unknown> | null = null
    let usage = {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    }
    let ttftMs = 0
    const start = Date.now()

    for await (const event of adaptedStream) {
      const evt = event as Record<string, unknown>

      switch (evt.type) {
        case 'message_start': {
          partialMessage = evt.message as Record<string, unknown>
          ttftMs = Date.now() - start
          if (partialMessage?.usage) {
            const msgUsage = partialMessage.usage as typeof usage
            usage = {
              input_tokens: msgUsage.input_tokens || usage.input_tokens,
              output_tokens: msgUsage.output_tokens || usage.output_tokens,
              cache_creation_input_tokens:
                msgUsage.cache_creation_input_tokens ||
                usage.cache_creation_input_tokens,
              cache_read_input_tokens:
                msgUsage.cache_read_input_tokens ||
                usage.cache_read_input_tokens,
            }
          }
          break
        }
        case 'content_block_start': {
          const idx = evt.index as number
          const cb = evt.content_block as Record<string, unknown>
          if (cb.type === 'tool_use') {
            contentBlocks[idx] = { ...cb, input: '' }
          } else if (cb.type === 'text') {
            contentBlocks[idx] = { ...cb, text: '' }
          } else if (cb.type === 'thinking') {
            contentBlocks[idx] = { ...cb, thinking: '', signature: '' }
          } else {
            contentBlocks[idx] = { ...cb }
          }
          break
        }
        case 'content_block_delta': {
          const idx = evt.index as number
          const delta = evt.delta as Record<string, unknown>
          const block = contentBlocks[idx]
          if (!block) break
          if (delta.type === 'text_delta') {
            block.text = (block.text || '') + (delta.text || '')
          } else if (delta.type === 'input_json_delta') {
            block.input = (block.input || '') + (delta.partial_json || '')
          } else if (delta.type === 'thinking_delta') {
            block.thinking = (block.thinking || '') + (delta.thinking || '')
          } else if (delta.type === 'signature_delta') {
            block.signature = delta.signature
          }
          break
        }
        case 'content_block_stop': {
          const idx = evt.index as number
          const block = contentBlocks[idx]
          if (!block || !partialMessage) break

          // Yield a per-block AssistantMessage (like Grok)
          const m: AssistantMessage = {
            message: {
              ...partialMessage,
              content: normalizeContentFromAPI(
                [block] as any,
                tools,
                options.agentId,
              ) as any,
            },
            requestId: undefined,
            type: 'assistant',
            uuid: randomUUID(),
            timestamp: new Date().toISOString(),
          }
          collectedMessages.push(m)
          yield m
          break
        }
        case 'message_delta': {
          const deltaUsage = evt.usage as typeof usage | undefined
          if (deltaUsage) {
            usage = {
              input_tokens: deltaUsage.input_tokens ?? usage.input_tokens,
              output_tokens: deltaUsage.output_tokens ?? usage.output_tokens,
              cache_creation_input_tokens:
                deltaUsage.cache_creation_input_tokens !== undefined &&
                deltaUsage.cache_creation_input_tokens > 0
                  ? deltaUsage.cache_creation_input_tokens
                  : usage.cache_creation_input_tokens,
              cache_read_input_tokens:
                deltaUsage.cache_read_input_tokens !== undefined &&
                deltaUsage.cache_read_input_tokens > 0
                  ? deltaUsage.cache_read_input_tokens
                  : usage.cache_read_input_tokens,
            }
          }
          break
        }
        case 'message_stop': {
          if (partialMessage && usage.input_tokens + usage.output_tokens > 0) {
            const costUSD = calculateUSDCost(ccModel, usage as any)
            addToTotalSessionCost(costUSD, usage as any, options.model)
          }
          break
        }
      }

      yield {
        type: 'stream_event',
        event,
        ...(event.type === 'message_start' ? { ttftMs } : undefined),
      } as StreamEvent
    }

    // Record LLM observation in Langfuse
    recordLLMObservation(options.langfuseTrace ?? null, {
      model: ccModel,
      provider: 'commandcode',
      input: convertMessagesToLangfuse(messagesForAPI, systemPrompt),
      output: convertOutputToLangfuse(collectedMessages),
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens,
        cache_read_input_tokens: usage.cache_read_input_tokens,
      },
      startTime: new Date(start),
      endTime: new Date(),
      completionStartTime: ttftMs > 0 ? new Date(start + ttftMs) : undefined,
      tools: convertToolsToLangfuse(toolSchemas as unknown[]),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logForDebugging(`[CommandCode] Error: ${errorMessage}`, { level: 'error' })
    yield createAssistantAPIErrorMessage({
      content: `API Error: ${errorMessage}`,
      apiError: 'api_error',
      error: (error instanceof Error
        ? error
        : new Error(String(error))) as unknown as SDKAssistantMessageError,
    })
  }
}
