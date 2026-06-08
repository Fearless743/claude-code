/**
 * Stream adapter: Command Code NDJSON → Anthropic BetaRawMessageStreamEvent.
 *
 * CC API returns NDJSON (newline-delimited JSON) with event types:
 * - start, start-step: ignored (no visible content)
 * - text-start, reasoning-start: ignored
 * - text-delta: text content delta
 * - reasoning-delta: thinking/reasoning content delta
 * - tool-call: complete tool call
 * - finish-step: step-level finish with usage
 * - finish: final finish with totalUsage
 * - error: error event
 *
 * This adapter converts these into Anthropic streaming events:
 * - message_start
 * - content_block_start / content_block_delta / content_block_stop
 * - message_delta (stop_reason, usage)
 * - message_stop
 */

import { randomUUID } from 'crypto'
import { logForDebugging } from 'src/utils/debug.js'

/** CC NDJSON event types */
export interface CCStreamEvent {
  type: string
  text?: string
  delta?: string
  toolCallId?: string
  toolName?: string
  input?: string | Record<string, unknown>
  finishReason?: string
  usage?: CCUsage
  totalUsage?: CCUsage
  error?: { message?: string }
  message?: string
}

export interface CCUsage {
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
}

/**
 * Adapt a Command Code NDJSON stream to Anthropic BetaRawMessageStreamEvent.
 */
export async function* adaptCommandCodeStreamToAnthropic(
  stream: ReadableStream<Uint8Array>,
  model: string,
): AsyncGenerator<Record<string, unknown>, void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // Content block tracking — each block gets a sequential index
  let blockIndex = 0
  let currentBlockType: 'text' | 'thinking' | null = null

  // Usage tracking
  let usage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  }
  let finishReason: string | null = null

  logForDebugging('[CommandCode] Stream adapter started')

  // Emit message_start
  yield {
    type: 'message_start',
    message: {
      id: `msg_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      type: 'message',
      role: 'assistant',
      content: [],
      model,
      stop_reason: null,
      stop_sequence: null,
      usage,
    },
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === '[DONE]' || trimmed.startsWith(':'))
          continue

        // Handle both SSE format (data: {...}) and raw NDJSON ({...})
        const jsonStr = trimmed.startsWith('data:')
          ? trimmed.slice(5).trim()
          : trimmed
        if (!jsonStr || jsonStr === '[DONE]') continue

        let event: CCStreamEvent
        try {
          event = JSON.parse(jsonStr)
        } catch {
          continue
        }
        if (!event.type) continue

        logForDebugging(`[CommandCode] Event: ${event.type}`)

        switch (event.type) {
          case 'text-delta': {
            const text = event.text || event.delta || ''
            if (!text) break

            if (currentBlockType !== 'text') {
              // Close previous block if open
              if (currentBlockType !== null) {
                yield { type: 'content_block_stop', index: blockIndex }
                blockIndex++
              }
              // Start text block
              currentBlockType = 'text'
              yield {
                type: 'content_block_start',
                index: blockIndex,
                content_block: { type: 'text', text: '' },
              }
            }

            yield {
              type: 'content_block_delta',
              index: blockIndex,
              delta: { type: 'text_delta', text },
            }
            break
          }

          case 'reasoning-delta': {
            const text = event.text || ''
            if (!text) break

            if (currentBlockType !== 'thinking') {
              // Close previous block if open
              if (currentBlockType !== null) {
                yield { type: 'content_block_stop', index: blockIndex }
                blockIndex++
              }
              // Start thinking block
              currentBlockType = 'thinking'
              yield {
                type: 'content_block_start',
                index: blockIndex,
                content_block: { type: 'thinking', thinking: '' },
              }
            }

            yield {
              type: 'content_block_delta',
              index: blockIndex,
              delta: { type: 'thinking_delta', thinking: text },
            }
            break
          }

          case 'tool-call': {
            // Close any open content block
            if (currentBlockType !== null) {
              yield { type: 'content_block_stop', index: blockIndex }
              blockIndex++
              currentBlockType = null
            }

            const toolId =
              event.toolCallId ||
              `toolu_${randomUUID().replace(/-/g, '').slice(0, 24)}`
            const toolName = event.toolName || ''
            const args =
              typeof event.input === 'string'
                ? event.input
                : JSON.stringify(event.input || {})

            yield {
              type: 'content_block_start',
              index: blockIndex,
              content_block: {
                type: 'tool_use',
                id: toolId,
                name: toolName,
                input: {},
              },
            }

            yield {
              type: 'content_block_delta',
              index: blockIndex,
              delta: { type: 'input_json_delta', partial_json: args },
            }

            yield { type: 'content_block_stop', index: blockIndex }
            blockIndex++
            break
          }

          case 'finish-step': {
            if (event.finishReason) {
              finishReason = mapFinishReason(event.finishReason)
            }
            if (event.usage) {
              usage = updateUsage(usage, event.usage)
            }
            break
          }

          case 'finish': {
            if (event.finishReason) {
              finishReason = mapFinishReason(event.finishReason)
            }
            if (event.totalUsage) {
              usage = updateUsage(usage, event.totalUsage)
            }
            break
          }

          case 'error': {
            const msg =
              event.error?.message || event.message || 'CC stream error'
            throw new Error(msg)
          }

          // Ignore: start, start-step, text-start, reasoning-start
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const event: CCStreamEvent = JSON.parse(buffer.trim())
        if (event.type === 'finish' && event.totalUsage) {
          usage = updateUsage(usage, event.totalUsage)
        }
      } catch {
        // ignore
      }
    }
  } finally {
    reader.releaseLock()
  }

  // Close any open content block
  if (currentBlockType !== null) {
    yield { type: 'content_block_stop', index: blockIndex }
    blockIndex++
  }

  // Emit message_delta with stop_reason and usage
  yield {
    type: 'message_delta',
    delta: {
      stop_reason: finishReason || 'end_turn',
      stop_sequence: null,
    },
    usage,
  }

  // Emit message_stop
  logForDebugging(
    `[CommandCode] Stream adapter finished, blocks=${blockIndex}, usage=${usage.input_tokens}in/${usage.output_tokens}out`,
  )
  yield { type: 'message_stop' }
}

/**
 * Map CC finish reason to Anthropic stop reason.
 */
function mapFinishReason(reason: string): string {
  switch (reason) {
    case 'tool-calls':
      return 'tool_use'
    case 'length':
      return 'max_tokens'
    case 'stop':
      return 'end_turn'
    default:
      return reason || 'end_turn'
  }
}

/**
 * Update accumulated usage from a CC usage event.
 */
function updateUsage(
  current: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens: number
    cache_read_input_tokens: number
  },
  delta: CCUsage,
): typeof current {
  return {
    input_tokens: delta.inputTokens ?? current.input_tokens,
    output_tokens: delta.outputTokens ?? current.output_tokens,
    cache_creation_input_tokens: current.cache_creation_input_tokens,
    cache_read_input_tokens:
      delta.cachedInputTokens ?? current.cache_read_input_tokens,
  }
}
