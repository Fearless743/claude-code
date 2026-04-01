/**
 * OpenAI Completions API client.
 *
 * Uses raw fetch to avoid adding the openai npm package dependency.
 * Supports any OpenAI-compatible endpoint (OpenAI, Azure OpenAI, local LLMs, etc.)
 */

import { getGlobalConfig, type LLMProvider } from '../../utils/config.js'
import { logForDebugging } from '../../utils/debug.js'
import { errorMessage } from '../../utils/errors.js'
import { getActiveProviderByType } from '../../utils/providers.js'

export type OpenAIModel = {
  id: string
  object: string
  created: number
  owned_by: string
}

export type OpenAIModelsResponse = {
  object: string
  data: OpenAIModel[]
}

export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

type InternalMessageLike = {
  type?: string
  message?: {
    role?: string
    content?: unknown
  }
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }
  if (!Array.isArray(content)) {
    return ''
  }
  return content
    .filter(
      (block): block is { type: string; text?: string } =>
        !!block && typeof block === 'object' && 'type' in block,
    )
    .filter(block => block.type === 'text')
    .map(block => block.text ?? '')
    .join('\n')
    .trim()
}

export function toOpenAIChatMessages(params: {
  system: { text?: string }[]
  messages: InternalMessageLike[]
}): OpenAIMessage[] {
  const result: OpenAIMessage[] = []

  const systemText = params.system
    .map(block => block.text ?? '')
    .filter(Boolean)
    .join('\n\n')
    .trim()

  if (systemText) {
    result.push({ role: 'system', content: systemText })
  }

  for (const message of params.messages) {
    const role = message.message?.role
    if (role !== 'user' && role !== 'assistant') {
      continue
    }

    const contentArray = Array.isArray(message.message?.content)
      ? message.message?.content
      : []

    if (role === 'assistant') {
      const toolUses = contentArray
        .filter(
          (
            block,
          ): block is {
            type: 'tool_use'
            id: string
            name: string
            input: unknown
          } =>
            !!block &&
            typeof block === 'object' &&
            'type' in block &&
            (block as { type?: string }).type === 'tool_use',
        )
        .map(block => ({
          id: block.id,
          type: 'function' as const,
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input ?? {}),
          },
        }))

      const assistantText = extractTextContent(message.message?.content)
      if (toolUses.length > 0 || assistantText) {
        result.push({
          role: 'assistant',
          content: assistantText,
          ...(toolUses.length > 0 && { tool_calls: toolUses }),
        })
      }
      continue
    }

    const toolResults = contentArray.filter(
      (
        block,
      ): block is {
        type: 'tool_result'
        tool_use_id: string
        content: unknown
      } =>
        !!block &&
        typeof block === 'object' &&
        'type' in block &&
        (block as { type?: string }).type === 'tool_result',
    )

    if (toolResults.length > 0) {
      for (const block of toolResults) {
        result.push({
          role: 'tool',
          tool_call_id: block.tool_use_id,
          content:
            extractTextContent(block.content) || String(block.content ?? ''),
        })
      }
      continue
    }

    const text = extractTextContent(message.message?.content)
    if (!text) {
      continue
    }

    result.push({ role, content: text })
  }

  return result
}

export function openAIToolsFromAnthropicTools(
  tools: Array<{
    name: string
    description?: string
    input_schema?: Record<string, unknown>
  }>,
): NonNullable<OpenAIChatCompletionRequest['tools']> {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema ?? { type: 'object', properties: {} },
    },
  }))
}

export function openAIToolChoiceFromAnthropic(
  toolChoice: { type: 'auto' } | { type: 'tool'; name: string } | undefined,
): OpenAIChatCompletionRequest['tool_choice'] | undefined {
  if (!toolChoice) return undefined
  if (toolChoice.type === 'auto') return 'auto'
  if (toolChoice.type === 'tool') {
    return {
      type: 'function',
      function: {
        name: toolChoice.name,
      },
    }
  }
  return undefined
}

export type OpenAIChatCompletionRequest = {
  model: string
  messages: OpenAIMessage[]
  max_tokens?: number
  temperature?: number
  stream?: boolean
  stop?: string | string[]
  frequency_penalty?: number
  presence_penalty?: number
  top_p?: number
  tools?: Array<{
    type: 'function'
    function: {
      name: string
      description?: string
      parameters: Record<string, unknown>
    }
  }>
  tool_choice?:
    | 'auto'
    | 'none'
    | { type: 'function'; function: { name: string } }
}

export type OpenAIChatCompletionResponse = {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: OpenAIMessage & {
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: {
          name: string
          arguments: string
        }
      }>
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type OpenAIChatCompletionChunk = {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: string
        function?: { name?: string; arguments?: string }
      }>
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export function chunkToAnthropicStyleEvents(params: {
  chunk: OpenAIChatCompletionChunk
  hasStarted: boolean
  hasTextBlockStarted: boolean
}): Array<Record<string, unknown>> {
  const { chunk, hasStarted, hasTextBlockStarted } = params
  const events: Array<Record<string, unknown>> = []
  const choice = chunk.choices[0]

  if (!hasStarted) {
    events.push({
      type: 'message_start',
      message: {
        id: chunk.id || 'openai-stream',
        model: chunk.model,
        role: 'assistant',
        content: [],
        usage: {
          input_tokens: 0,
          output_tokens: 0,
        },
      },
    })
  }

  const deltaText = choice?.delta?.content ?? ''
  if (deltaText && !hasTextBlockStarted) {
    events.push({
      type: 'content_block_start',
      index: 0,
      content_block: {
        type: 'text',
        text: '',
      },
    })
  }
  if (deltaText) {
    events.push({
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'text_delta',
        text: deltaText,
      },
    })
  }

  for (const tc of choice?.delta?.tool_calls ?? []) {
    if (tc.id || tc.function?.name) {
      events.push({
        type: 'content_block_start',
        index: tc.index + 1,
        content_block: {
          type: 'tool_use',
          id: tc.id ?? `openai-tool-${tc.index}`,
          name: tc.function?.name ?? '',
          input: '',
        },
      })
    }
    if (tc.function?.arguments) {
      events.push({
        type: 'content_block_delta',
        index: tc.index + 1,
        delta: {
          type: 'input_json_delta',
          partial_json: tc.function.arguments,
        },
      })
    }
  }

  return events
}

export function normalizeOpenAIBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
}

export function getOpenAIProvider(): LLMProvider | undefined {
  return getActiveProviderByType('openai')
}

function getOpenAIBaseUrl(provider = getOpenAIProvider()): string {
  const raw =
    process.env.OPENAI_BASE_URL ||
    provider?.baseUrl ||
    getGlobalConfig().openaiBaseUrl ||
    'https://api.openai.com/v1'

  return normalizeOpenAIBaseUrl(raw)
}

function getOpenAIApiKey(provider = getOpenAIProvider()): string | undefined {
  return (
    process.env.OPENAI_API_KEY ||
    provider?.apiKey ||
    getGlobalConfig().openaiApiKey
  )
}

/**
 * Fetch available models from the OpenAI API.
 */
export async function fetchOpenAIModels(): Promise<OpenAIModel[]> {
  const provider = getOpenAIProvider()
  const apiKey = getOpenAIApiKey(provider)
  if (!apiKey) {
    throw new Error(
      'OpenAI API key not configured. Set OPENAI_API_KEY or run /config to configure.',
    )
  }

  const baseUrl = getOpenAIBaseUrl(provider)
  const url = `${baseUrl}/models`

  logForDebugging(`[OpenAI] Fetching models from ${url}`)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenAI API error (${response.status}): ${body}`)
  }

  const data: OpenAIModelsResponse = await response.json()
  logForDebugging(`[OpenAI] Fetched ${data.data.length} models`)
  return data.data
}

/**
 * Make a non-streaming chat completion request.
 */
export async function createChatCompletion(
  request: OpenAIChatCompletionRequest,
): Promise<OpenAIChatCompletionResponse> {
  const provider = getOpenAIProvider()
  const apiKey = getOpenAIApiKey(provider)
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const baseUrl = getOpenAIBaseUrl(provider)
  const url = `${baseUrl}/chat/completions`

  logForDebugging(
    `[OpenAI] Chat completion request: model=${request.model}, messages=${request.messages.length}`,
  )

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: false,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenAI API error (${response.status}): ${body}`)
  }

  return response.json()
}

/**
 * Make a streaming chat completion request.
 * Returns an async generator that yields chunks.
 */
export async function* createStreamingChatCompletion(
  request: OpenAIChatCompletionRequest,
  signal?: AbortSignal,
): AsyncGenerator<OpenAIChatCompletionChunk> {
  const provider = getOpenAIProvider()
  const apiKey = getOpenAIApiKey(provider)
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const baseUrl = getOpenAIBaseUrl(provider)
  const url = `${baseUrl}/chat/completions`

  logForDebugging(`[OpenAI] Streaming chat completion: model=${request.model}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenAI API error (${response.status}): ${body}`)
  }

  if (!response.body) {
    throw new Error('OpenAI API response has no body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const chunk: OpenAIChatCompletionChunk = JSON.parse(trimmed.slice(6))
          yield chunk
        } catch (e) {
          logForDebugging(`[OpenAI] Failed to parse chunk: ${errorMessage(e)}`)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
