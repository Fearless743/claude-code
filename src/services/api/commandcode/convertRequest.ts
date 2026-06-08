/**
 * Request conversion: Anthropic format → Command Code envelope format.
 *
 * CC API uses a proprietary envelope with fields:
 * - config: working directory, date, environment, git info
 * - memory, taste, skills: context strings
 * - permissionMode: 'standard'
 * - params: model, messages, system, tools, max_tokens, etc.
 * - threadId: unique per-request UUID
 */

import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type { Message } from '../../../types/message.js'
import type { SystemPrompt } from '../../../utils/systemPromptType.js'

/** CC request envelope */
export interface CommandCodeRequest {
  config: {
    workingDir: string
    date: string
    environment: string
    structure: string[]
    isGitRepo: boolean
    currentBranch: string
    mainBranch: string
    gitStatus: string
    recentCommits: string[]
  }
  memory: string
  taste: string
  skills: string
  permissionMode: string
  params: {
    model: string
    messages: CommandCodeMessage[]
    max_tokens: number
    stream: true
    system?: string
    temperature?: number
    tools?: CommandCodeTool[]
    tool_choice?: { type: string; name?: string }
    reasoning_effort?: string
  }
  threadId: string
}

/** CC message format */
export interface CommandCodeMessage {
  role: 'user' | 'assistant' | 'tool'
  content: CommandCodeContentPart[]
}

export type CommandCodeContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: string }
  | {
      type: 'tool-call'
      toolCallId: string
      toolName: string
      input: Record<string, unknown>
    }
  | {
      type: 'tool-result'
      toolCallId: string
      toolName: string
      output: { type: 'text'; value: string }
    }

/** CC tool format */
export interface CommandCodeTool {
  type: string
  name: string
  description: string
  input_schema: Record<string, unknown>
}

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getEnvironment(): string {
  return `${process.platform}-${process.arch}, Bun ${Bun.version}`
}

/**
 * Build a Command Code request envelope from Anthropic-format inputs.
 */
export function buildCommandCodeRequest(params: {
  model: string
  messages: Message[]
  systemPrompt: SystemPrompt
  tools: BetaToolUnion[]
  maxTokens: number
  temperature?: number
  threadId: string
}): CommandCodeRequest {
  // Build tool_call_id → tool_name reverse lookup
  const toolNameMap = new Map<string, string>()
  for (const msg of params.messages) {
    if (msg.type === 'assistant' && msg.message?.content) {
      const content = msg.message.content as unknown as Record<
        string,
        unknown
      >[]
      for (const block of content) {
        if (
          block.type === 'tool_use' &&
          typeof block.id === 'string' &&
          block.id
        ) {
          toolNameMap.set(block.id, (block.name as string) || '')
        }
      }
    }
  }

  const ccMessages = convertMessages(params.messages, toolNameMap)

  // Extract system prompt text
  const systemText = extractSystemPromptText(params.systemPrompt)

  // Convert tools
  const ccTools: CommandCodeTool[] = params.tools
    .filter(t => {
      const anyT = t as unknown as Record<string, unknown>
      return (
        anyT.type !== 'advisor_20260301' && anyT.type !== 'computer_20250124'
      )
    })
    .map(t => {
      const anyT = t as unknown as Record<string, unknown>
      return {
        type: (anyT.type as string) || 'function',
        name: (anyT.name as string) || '',
        description: (anyT.description as string) || '',
        input_schema: (anyT.input_schema as Record<string, unknown>) ||
          (anyT.parameters as Record<string, unknown>) || {
            type: 'object',
            properties: {},
          },
      }
    })

  const body: CommandCodeRequest = {
    config: {
      workingDir: process.cwd(),
      date: getDateStr(),
      environment: getEnvironment(),
      structure: [],
      isGitRepo: false,
      currentBranch: '',
      mainBranch: '',
      gitStatus: '',
      recentCommits: [],
    },
    memory: '',
    taste: '',
    skills: '',
    permissionMode: 'standard',
    params: {
      model: params.model,
      messages: ccMessages,
      max_tokens: Math.min(params.maxTokens, 200000),
      stream: true,
    },
    threadId: params.threadId,
  }

  if (systemText) {
    body.params.system = systemText
  }

  if (params.temperature !== undefined) {
    body.params.temperature = params.temperature
  }

  if (ccTools.length > 0) {
    body.params.tools = ccTools
  }

  return body
}

/**
 * Extract system prompt text from SystemPrompt type.
 */
function extractSystemPromptText(systemPrompt: SystemPrompt): string {
  if (typeof systemPrompt === 'string') return systemPrompt
  if (Array.isArray(systemPrompt)) {
    return systemPrompt
      .map(block => {
        if (typeof block === 'string') return block
        if (typeof block === 'object' && block !== null && 'text' in block)
          return (block as { text: string }).text
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

/**
 * Convert Anthropic messages to CC message format.
 */
function convertMessages(
  messages: Message[],
  toolNameMap: Map<string, string>,
): CommandCodeMessage[] {
  const result: CommandCodeMessage[] = []

  for (const msg of messages) {
    if (msg.type === 'user') {
      const parts = convertUserMessage(msg, toolNameMap)
      if (parts.length > 0) {
        result.push({ role: 'user', content: parts })
      }
    } else if (msg.type === 'assistant') {
      const parts = convertAssistantMessage(msg)
      if (parts.length > 0) {
        result.push({ role: 'assistant', content: parts })
      }
    }
  }

  // Separate tool results into their own messages (CC expects tool role)
  const finalResult: CommandCodeMessage[] = []
  for (const msg of result) {
    if (msg.role === 'user') {
      const toolResults: CommandCodeContentPart[] = []
      const userParts: CommandCodeContentPart[] = []

      for (const part of msg.content) {
        if (part.type === 'tool-result') {
          toolResults.push(part)
        } else {
          userParts.push(part)
        }
      }

      // Tool results go first as separate tool-role messages
      for (const tr of toolResults) {
        finalResult.push({ role: 'tool', content: [tr] })
      }

      if (userParts.length > 0) {
        finalResult.push({ role: 'user', content: userParts })
      }
    } else {
      finalResult.push(msg)
    }
  }

  return finalResult
}

/**
 * Convert a user message to CC content parts.
 */
function convertUserMessage(
  msg: Message,
  toolNameMap: Map<string, string>,
): CommandCodeContentPart[] {
  const parts: CommandCodeContentPart[] = []

  if (!msg.message?.content) return parts

  const content = msg.message.content

  if (typeof content === 'string') {
    parts.push({ type: 'text', text: content })
    return parts
  }

  if (Array.isArray(content)) {
    for (const block of content as unknown as Record<string, unknown>[]) {
      if (block.type === 'text') {
        parts.push({ type: 'text', text: (block.text as string) || '' })
      } else if (block.type === 'tool_result') {
        const outputText = extractToolResultContent(block)
        parts.push({
          type: 'tool-result',
          toolCallId: (block.tool_use_id as string) || '',
          toolName: toolNameMap.get((block.tool_use_id as string) || '') || '',
          output: { type: 'text', value: outputText },
        })
      } else if (block.type === 'image') {
        const source = block.source as Record<string, unknown> | undefined
        if (source?.type === 'base64') {
          const mediaType = (source.media_type as string) || 'image/jpeg'
          const data = (source.data as string) || ''
          parts.push({
            type: 'image',
            image: `data:${mediaType};base64,${data}`,
          })
        }
      }
    }
  }

  return parts
}

/**
 * Extract text content from a tool_result block.
 */
function extractToolResultContent(block: Record<string, unknown>): string {
  const content = block.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((c: Record<string, unknown>) => c.type === 'text')
      .map((c: Record<string, unknown>) => (c.text as string) || '')
      .join('\n')
  }
  return JSON.stringify(content || '')
}

/**
 * Convert an assistant message to CC content parts.
 */
function convertAssistantMessage(msg: Message): CommandCodeContentPart[] {
  const parts: CommandCodeContentPart[] = []

  if (!msg.message?.content) return parts

  const content = msg.message.content

  if (typeof content === 'string') {
    parts.push({ type: 'text', text: content })
    return parts
  }

  if (Array.isArray(content)) {
    for (const block of content as unknown as Record<string, unknown>[]) {
      if (block.type === 'text') {
        parts.push({ type: 'text', text: (block.text as string) || '' })
      } else if (block.type === 'tool_use') {
        parts.push({
          type: 'tool-call',
          toolCallId: (block.id as string) || '',
          toolName: (block.name as string) || '',
          input:
            typeof block.input === 'string'
              ? tryParseJSON(block.input as string)
              : (block.input as Record<string, unknown>) || {},
        })
      }
      // Skip thinking blocks - CC handles reasoning internally
    }
  }

  return parts
}

function tryParseJSON(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}
