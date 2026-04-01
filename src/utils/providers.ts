import {
  getGlobalConfig,
  type LLMProvider,
  type ProviderType,
} from './config.js'

export function createProviderId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function getProviders(): LLMProvider[] {
  return getGlobalConfig().llmProviders ?? []
}

export function getActiveProviderId(): string | undefined {
  return getGlobalConfig().activeProviderId
}

export function getActiveProvider(): LLMProvider | undefined {
  const providers = getProviders()
  const activeProviderId = getActiveProviderId()
  if (activeProviderId) {
    const active = providers.find(provider => provider.id === activeProviderId)
    if (active) return active
  }
  return providers[0]
}

export function getProvidersByType(type: ProviderType): LLMProvider[] {
  return getProviders().filter(provider => provider.type === type)
}

export function getActiveProviderByType(
  type: ProviderType,
): LLMProvider | undefined {
  const active = getActiveProvider()
  if (active?.type === type) return active
  return getProvidersByType(type)[0]
}

export function migrateLegacyOpenAIConfig(config: {
  llmProviders?: LLMProvider[]
  activeProviderId?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  openaiModels?: string[]
}): {
  llmProviders?: LLMProvider[]
  activeProviderId?: string
} {
  if (config.llmProviders && config.llmProviders.length > 0) {
    return {
      llmProviders: config.llmProviders,
      activeProviderId: config.activeProviderId,
    }
  }

  if (
    !config.openaiApiKey &&
    !config.openaiBaseUrl &&
    !config.openaiModels?.length
  ) {
    return {
      llmProviders: config.llmProviders,
      activeProviderId: config.activeProviderId,
    }
  }

  const provider: LLMProvider = {
    id: 'openai-default',
    name: 'OpenAI',
    type: 'openai',
    apiKey: config.openaiApiKey,
    baseUrl: config.openaiBaseUrl,
    models: config.openaiModels,
  }

  return {
    llmProviders: [provider],
    activeProviderId: config.activeProviderId ?? provider.id,
  }
}

export function getProviderModels(provider?: LLMProvider): string[] {
  return provider?.models ?? []
}
