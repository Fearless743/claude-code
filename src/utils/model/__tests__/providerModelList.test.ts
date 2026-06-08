import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  buildProviderModelsUrl,
  buildProviderModelsUrls,
  clearProviderModelListCacheForTesting,
  fetchDynamicModelOptions,
  parseProviderModelOptions,
} from '../providerModelList'

const ENV_KEYS = [
  'CLAUDE_CODE_USE_OPENAI',
  'CLAUDE_CODE_USE_GEMINI',
  'CLAUDE_CODE_USE_GROK',
  'OPENAI_AUTH_MODE',
  'OPENAI_BASE_URL',
  'OPENAI_API_KEY',
  'GEMINI_BASE_URL',
  'GEMINI_API_KEY',
  'GROK_BASE_URL',
  'GROK_API_KEY',
  'XAI_API_KEY',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_API_KEY',
] as const

const savedEnv: Record<string, string | undefined> = {}

describe('providerModelList', () => {
  beforeEach(() => {
    clearProviderModelListCacheForTesting()
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    clearProviderModelListCacheForTesting()
    for (const key of ENV_KEYS) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key]
      } else {
        delete process.env[key]
      }
    }
  })

  test('builds /v1/models URL without duplicating /v1', () => {
    expect(buildProviderModelsUrl('https://api.example.com')).toBe(
      'https://api.example.com/v1/models',
    )
    expect(buildProviderModelsUrl('https://api.example.com/')).toBe(
      'https://api.example.com/v1/models',
    )
    expect(buildProviderModelsUrl('https://api.example.com/v1')).toBe(
      'https://api.example.com/v1/models',
    )
    expect(buildProviderModelsUrl('https://api.example.com/v1/')).toBe(
      'https://api.example.com/v1/models',
    )
  })

  test('buildProviderModelsUrls returns multiple candidates', () => {
    const urls = buildProviderModelsUrls('https://api.example.com')
    expect(urls).toContain('https://api.example.com/v1/models')
    expect(urls).toContain('https://api.example.com/models')
    expect(urls).toContain('https://api.example.com/api/models')
    expect(urls).toContain('https://api.example.com/api/tags')
  })

  test('buildProviderModelsUrls deduplicates when base already has /v1', () => {
    const urls = buildProviderModelsUrls('https://api.example.com/v1')
    const unique = new Set(urls)
    expect(urls.length).toBe(unique.size)
    expect(urls[0]).toBe('https://api.example.com/v1/models')
  })

  test('parses OpenAI and Anthropic style data responses', () => {
    expect(parseProviderModelOptions({ data: [{ id: 'gpt-4.1' }] })).toEqual([
      {
        value: 'gpt-4.1',
        label: 'gpt-4.1',
        description: 'Available from configured provider',
        descriptionForModel: 'Available from configured provider (gpt-4.1)',
      },
    ])
  })

  test('parses models id responses', () => {
    expect(
      parseProviderModelOptions({ models: [{ id: 'llama3.1' }] })[0]?.value,
    ).toBe('llama3.1')
  })

  test('parses Gemini-like model name responses', () => {
    expect(
      parseProviderModelOptions({
        models: [{ name: 'models/gemini-2.5-pro' }],
      })[0]?.value,
    ).toBe('gemini-2.5-pro')
  })

  test('parses array responses and removes duplicate model ids', () => {
    expect(
      parseProviderModelOptions([{ id: 'a' }, { id: 'a' }, { id: 'b' }]).map(
        option => option.value,
      ),
    ).toEqual(['a', 'b'])
  })

  test('returns disabled when no provider endpoint is configured', async () => {
    const result = await fetchDynamicModelOptions()
    expect(result.status).toBe('disabled')
  })

  test('fetches OpenAI-compatible models with bearer auth', async () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'https://api.example.com/v1'
    process.env.OPENAI_API_KEY = 'secret-key'

    let requestedUrl = ''
    let authHeader: string | undefined
    const result = await fetchDynamicModelOptions({
      fetchOverride: async (input, init) => {
        requestedUrl = String(input)
        authHeader =
          new Headers(init?.headers).get('authorization') ?? undefined
        return Response.json({ data: [{ id: 'model-a' }] })
      },
    })

    expect(requestedUrl).toBe('https://api.example.com/v1/models')
    expect(authHeader).toBe('Bearer secret-key')
    expect(result).toEqual({
      status: 'success',
      options: [
        {
          value: 'model-a',
          label: 'model-a',
          description: 'Available from configured provider',
          descriptionForModel: 'Available from configured provider (model-a)',
        },
      ],
    })
  })

  test('omits auth header when OpenAI-compatible key is blank', async () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'http://localhost:11434/v1'

    let authHeader: string | null = 'unexpected'
    await fetchDynamicModelOptions({
      fetchOverride: async (_input, init) => {
        authHeader = new Headers(init?.headers).get('authorization')
        return Response.json({ data: [{ id: 'llama' }] })
      },
    })

    expect(authHeader).toBeNull()
  })

  test('returns non-fatal HTTP errors', async () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'https://api.example.com'

    const result = await fetchDynamicModelOptions({
      fetchOverride: async () => new Response('unauthorized', { status: 401 }),
    })

    expect(result).toEqual({
      status: 'error',
      error: 'Provider model list request failed with HTTP 401',
    })
  })

  test('returns non-fatal invalid response errors', async () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'https://api.example.com'

    const result = await fetchDynamicModelOptions({
      fetchOverride: async () => Response.json({ object: 'list' }),
    })

    expect(result).toEqual({
      status: 'error',
      error: 'Provider returned no models',
    })
  })

  test('uses Gemini API key header', async () => {
    process.env.CLAUDE_CODE_USE_GEMINI = '1'
    process.env.GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com'
    process.env.GEMINI_API_KEY = 'gemini-key'

    let apiKeyHeader: string | undefined
    await fetchDynamicModelOptions({
      fetchOverride: async (_input, init) => {
        apiKeyHeader =
          new Headers(init?.headers).get('x-goog-api-key') ?? undefined
        return Response.json({ models: [{ name: 'models/gemini-2.5-pro' }] })
      },
    })

    expect(apiKeyHeader).toBe('gemini-key')
  })

  test('falls back to alternative endpoint when first URL returns 404', async () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'https://api.example.com'
    process.env.OPENAI_API_KEY = 'key'

    const requestedUrls: string[] = []
    const result = await fetchDynamicModelOptions({
      fetchOverride: async (input, _init) => {
        requestedUrls.push(String(input))
        if (requestedUrls.length === 1) {
          return new Response('not found', { status: 404 })
        }
        return Response.json({ data: [{ id: 'fallback-model' }] })
      },
    })

    expect(requestedUrls.length).toBe(2)
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.options[0]?.value).toBe('fallback-model')
    }
  })

  test('does not cache error results', async () => {
    process.env.CLAUDE_CODE_USE_OPENAI = '1'
    process.env.OPENAI_BASE_URL = 'https://api.example.com'
    process.env.OPENAI_API_KEY = 'key'

    // First call: all URLs return 404 so it fails
    let firstCall = true
    const result1 = await fetchDynamicModelOptions({
      fetchOverride: async () => {
        if (firstCall) return new Response('not found', { status: 404 })
        return Response.json({ data: [{ id: 'model-a' }] })
      },
    })
    firstCall = false
    expect(result1.status).toBe('error')

    // After clearing cache, a fresh fetch should succeed
    clearProviderModelListCacheForTesting()
    const result2 = await fetchDynamicModelOptions({
      fetchOverride: async () => Response.json({ data: [{ id: 'model-a' }] }),
    })
    expect(result2.status).toBe('success')
  })
})
