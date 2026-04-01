import { describe, expect, test } from 'bun:test'
import { getAPIProviderFromConfig } from '../providers.js'

describe('getAPIProviderFromConfig', () => {
  test('returns openai when openai key exists and no other provider is enabled', () => {
    expect(
      getAPIProviderFromConfig({
        openAIApiKey: 'sk-test',
      }),
    ).toBe('openai')
  })

  test('prefers explicitly enabled bedrock over openai key', () => {
    expect(
      getAPIProviderFromConfig({
        useBedrock: '1',
        openAIApiKey: 'sk-test',
      }),
    ).toBe('bedrock')
  })
})
