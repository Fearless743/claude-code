import { describe, expect, test } from 'bun:test'
import { getOpenAIModelOptionsFromCache } from '../modelOptions.js'

describe('getOpenAIModelOptionsFromCache', () => {
  test('returns cached models when openai is configured', () => {
    expect(
      getOpenAIModelOptionsFromCache({
        isOpenAIConfigured: true,
        cachedModels: ['gpt-4o', 'gpt-4o-mini'],
      }),
    ).toEqual([
      {
        value: 'gpt-4o',
        label: 'gpt-4o',
        description: 'OpenAI model (gpt-4o)',
      },
      {
        value: 'gpt-4o-mini',
        label: 'gpt-4o-mini',
        description: 'OpenAI model (gpt-4o-mini)',
      },
    ])
  })

  test('returns empty list when openai is not configured', () => {
    expect(
      getOpenAIModelOptionsFromCache({
        isOpenAIConfigured: false,
        cachedModels: ['gpt-4o'],
      }),
    ).toEqual([])
  })
})
