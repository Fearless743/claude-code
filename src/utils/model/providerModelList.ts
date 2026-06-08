import type { ModelOption } from './modelOptions.js'
import { getAPIProvider, isFirstPartyAnthropicBaseUrl } from './providers.js'
import { isChatGPTAuthMode } from './chatgptModels.js'
import { isModelAllowed } from './modelAllowlist.js'

const MODEL_LIST_TIMEOUT_MS = 5000

export type DynamicModelFetchResult =
  | { status: 'disabled'; reason: string }
  | { status: 'success'; options: ModelOption[] }
  | { status: 'error'; error: string }

type ProviderModelConfig = {
  baseUrl: string
  apiKey: string
  headers: Record<string, string>
  /** Override URLs — when set, skip buildProviderModelsUrls and use these directly. */
  urls?: string[]
}

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>

const modelListCache = new Map<string, DynamicModelFetchResult>()

export function buildProviderModelsUrls(baseUrl: string): string[] {
  const trimmed = baseUrl.replace(/\/+$/, '')
  const hasV1Suffix = trimmed.endsWith('/v1')
  const base = hasV1Suffix ? trimmed.slice(0, -3) : trimmed

  // Try the most common OpenAI-compatible endpoint first, then common alternatives.
  // Deduplicate since `${trimmed}/models` and `${base}/v1/models` overlap when
  // the base URL already ends with /v1.
  const candidates = [
    ...(hasV1Suffix
      ? [`${trimmed}/models`]
      : [`${base}/v1/models`, `${base}/models`]),
    `${base}/api/models`,
    `${base}/api/tags`,
  ]
  const seen = new Set<string>()
  return candidates.filter(url => {
    if (seen.has(url)) return false
    seen.add(url)
    return true
  })
}

/**
 * @deprecated Use buildProviderModelsUrls instead.
 */
export function buildProviderModelsUrl(baseUrl: string): string {
  return (
    buildProviderModelsUrls(baseUrl)[0] ??
    `${baseUrl.replace(/\/+$/, '')}/v1/models`
  )
}

export function clearProviderModelListCacheForTesting(): void {
  modelListCache.clear()
}

export function parseProviderModelOptions(raw: unknown): ModelOption[] {
  const entries = extractModelEntries(raw)
  const seen = new Set<string>()
  const options: ModelOption[] = []

  for (const entry of entries) {
    const modelId = extractModelId(entry)
    if (!modelId || seen.has(modelId)) continue
    seen.add(modelId)
    options.push({
      value: modelId,
      label: modelId,
      description: 'Available from configured provider',
      descriptionForModel: `Available from configured provider (${modelId})`,
    })
  }

  return options
}

export async function fetchDynamicModelOptions(params?: {
  signal?: AbortSignal
  fetchOverride?: FetchLike
}): Promise<DynamicModelFetchResult> {
  const config = getProviderModelConfig()
  if (!config) {
    return {
      status: 'disabled',
      reason: 'No configured provider model endpoint',
    }
  }

  const provider = getAPIProvider()
  const cacheKey = `${provider}:${config.baseUrl}`
  const cached = modelListCache.get(cacheKey)
  if (cached) return cached

  const urls = config.urls ?? buildProviderModelsUrls(config.baseUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), MODEL_LIST_TIMEOUT_MS)
  const signal = mergeAbortSignals(params?.signal, controller.signal)
  const fetchImpl = params?.fetchOverride ?? fetch

  try {
    for (const url of urls) {
      try {
        const response = await fetchImpl(url, {
          method: 'GET',
          headers: config.headers,
          signal,
        })

        // Only fall back to next URL on 404; other HTTP errors are definitive.
        if (response.status === 404) continue
        if (!response.ok) {
          return {
            status: 'error',
            error: `Provider model list request failed with HTTP ${response.status}`,
          }
        }

        const raw = await response.json()
        const options = parseProviderModelOptions(raw).filter(
          option => option.value === null || isModelAllowed(option.value),
        )

        if (options.length > 0) {
          return cacheResult(cacheKey, { status: 'success', options })
        }

        return { status: 'error', error: 'Provider returned no models' }
      } catch {
        // Try next URL candidate
      }
    }

    return {
      status: 'error',
      error: 'No model list endpoint found for configured provider',
    }
  } finally {
    clearTimeout(timeout)
  }
}

function cacheResult(
  cacheKey: string,
  result: DynamicModelFetchResult,
): DynamicModelFetchResult {
  modelListCache.set(cacheKey, result)
  return result
}

function getProviderModelConfig(): ProviderModelConfig | null {
  const provider = getAPIProvider()

  if (provider === 'openai') {
    if (isChatGPTAuthMode()) return null
    const baseUrl = process.env.OPENAI_BASE_URL
    if (!baseUrl) return null
    const apiKey = process.env.OPENAI_API_KEY ?? ''
    return {
      baseUrl,
      apiKey,
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    }
  }

  if (provider === 'gemini') {
    const baseUrl = process.env.GEMINI_BASE_URL
    if (!baseUrl) return null
    const apiKey = process.env.GEMINI_API_KEY ?? ''
    return {
      baseUrl,
      apiKey,
      headers: apiKey ? { 'x-goog-api-key': apiKey } : {},
    }
  }

  if (provider === 'grok') {
    const baseUrl = process.env.GROK_BASE_URL
    if (!baseUrl) return null
    const apiKey = process.env.GROK_API_KEY ?? process.env.XAI_API_KEY ?? ''
    return {
      baseUrl,
      apiKey,
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    }
  }

  if (provider === 'commandcode') {
    const baseUrl =
      process.env.COMMANDCODE_BASE_URL || 'https://api.commandcode.ai'
    const apiKey = process.env.COMMANDCODE_API_KEY ?? ''
    if (!apiKey) return null
    const trimmed = baseUrl.replace(/\/+$/, '')
    return {
      baseUrl,
      apiKey,
      headers: { Authorization: `Bearer ${apiKey}` },
      urls: [`${trimmed}/provider/v1/models`],
    }
  }

  if (provider === 'firstParty') {
    if (isFirstPartyAnthropicBaseUrl()) return null
    const baseUrl = process.env.ANTHROPIC_BASE_URL
    if (!baseUrl) return null
    const apiKey =
      process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.ANTHROPIC_API_KEY ?? ''
    return {
      baseUrl,
      apiKey,
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
            'x-api-key': apiKey,
          }
        : {},
    }
  }

  return null
}

function extractModelEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!isRecord(raw)) return []

  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.models)) return raw.models

  return []
}

function extractModelId(entry: unknown): string | null {
  if (!isRecord(entry)) return null

  const id = entry.id
  if (typeof id === 'string' && id.trim()) return id.trim()

  const name = entry.name
  if (typeof name === 'string' && name.trim()) {
    return name.trim().replace(/^models\//, '')
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function mergeAbortSignals(
  signalA: AbortSignal | undefined,
  signalB: AbortSignal,
): AbortSignal {
  if (!signalA) return signalB
  if (signalA.aborted) return signalA

  const controller = new AbortController()
  const abort = () => controller.abort()
  signalA.addEventListener('abort', abort, { once: true })
  signalB.addEventListener('abort', abort, { once: true })
  return controller.signal
}
