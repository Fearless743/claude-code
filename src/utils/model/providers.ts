import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
import { getGlobalConfig } from '../config.js'
import { isEnvTruthy } from '../envUtils.js'
import { getActiveProvider } from '../providers.js'

export type APIProvider =
  | 'firstParty'
  | 'bedrock'
  | 'vertex'
  | 'foundry'
  | 'openai'

export function getAPIProvider(): APIProvider {
  let openAIApiKey = process.env.OPENAI_API_KEY

  // getAPIProvider() is called during very early startup (e.g. betas/advisor
  // checks) before config reading is allowed. In that phase we must not touch
  // global config yet, otherwise startup crashes with
  // "Config accessed before allowed.".
  //
  // So we:
  // 1. always honor explicit env flags immediately
  // 2. best-effort read the persisted OpenAI key only after config becomes
  //    available; if it's too early, silently fall back to env-only detection.
  try {
    openAIApiKey ||=
      getActiveProvider()?.type === 'openai'
        ? getActiveProvider()?.apiKey || getGlobalConfig().openaiApiKey
        : getGlobalConfig().openaiApiKey
  } catch {
    // Ignore early-startup config guard; env-based provider detection still works.
  }

  return getAPIProviderFromConfig({
    useOpenAI: process.env.CLAUDE_CODE_USE_OPENAI,
    useBedrock: process.env.CLAUDE_CODE_USE_BEDROCK,
    useVertex: process.env.CLAUDE_CODE_USE_VERTEX,
    useFoundry: process.env.CLAUDE_CODE_USE_FOUNDRY,
    openAIApiKey,
  })
}

export function getAPIProviderFromConfig(params: {
  useOpenAI?: string
  useBedrock?: string
  useVertex?: string
  useFoundry?: string
  openAIApiKey?: string
}): APIProvider {
  return isEnvTruthy(params.useOpenAI)
    ? 'openai'
    : !isEnvTruthy(params.useBedrock) &&
        !isEnvTruthy(params.useVertex) &&
        !isEnvTruthy(params.useFoundry) &&
        !!params.openAIApiKey
      ? 'openai'
      : isEnvTruthy(params.useBedrock)
        ? 'bedrock'
        : isEnvTruthy(params.useVertex)
          ? 'vertex'
          : isEnvTruthy(params.useFoundry)
            ? 'foundry'
            : 'firstParty'
}

export function getAPIProviderForStatsig(): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  return getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if ANTHROPIC_BASE_URL is a first-party Anthropic API URL.
 * Returns true if not set (default API) or points to api.anthropic.com
 * (or api-staging.anthropic.com for ant users).
 */
export function isFirstPartyAnthropicBaseUrl(): boolean {
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) {
    return true
  }
  try {
    const host = new URL(baseUrl).host
    const allowedHosts = ['api.anthropic.com']
    if (process.env.USER_TYPE === 'ant') {
      allowedHosts.push('api-staging.anthropic.com')
    }
    return allowedHosts.includes(host)
  } catch {
    return false
  }
}
