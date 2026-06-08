/**
 * Model mapping for Command Code provider.
 *
 * Maps Anthropic model names to Command Code model IDs.
 * CC uses "provider/model" format (e.g. "deepseek/deepseek-v4-flash").
 */

import { getInitialSettings } from '../../../utils/settings/settings.js'

/** Default model map: Anthropic family → CC model ID */
const DEFAULT_MODEL_MAP: Record<string, string> = {
  sonnet: 'anthropic/claude-sonnet-4-20250514',
  opus: 'anthropic/claude-opus-4-20250514',
  haiku: 'anthropic/claude-haiku-4-5-20251001',
}

/**
 * Resolve an Anthropic model name to a Command Code model ID.
 *
 * Priority:
 * 1. COMMANDCODE_MODEL env var (global override)
 * 2. Per-family env var (COMMANDCODE_DEFAULT_SONNET_MODEL, etc.)
 * 3. Shared per-family env var (ANTHROPIC_DEFAULT_SONNET_MODEL, etc.)
 * 4. Built-in DEFAULT_MODEL_MAP
 * 5. Fall through to the original model name
 */
export function resolveCommandCodeModel(anthropicModel: string): string {
  // Global override
  const globalOverride = process.env.COMMANDCODE_MODEL
  if (globalOverride) return globalOverride

  // Extract family from model name
  const family = extractFamily(anthropicModel)

  if (family) {
    const familyKey = family.toUpperCase()
    // Per-family CC-specific env var
    const familyOverride = process.env[`COMMANDCODE_DEFAULT_${familyKey}_MODEL`]
    if (familyOverride) return familyOverride

    // Shared per-family env var
    const sharedOverride = process.env[`ANTHROPIC_DEFAULT_${familyKey}_MODEL`]
    if (sharedOverride) return sharedOverride

    // Built-in map
    const mapped = DEFAULT_MODEL_MAP[family]
    if (mapped) return mapped
  }

  // Fall through: return as-is (user may pass a CC model ID directly)
  return anthropicModel
}

/**
 * Extract the model family (sonnet/opus/haiku) from an Anthropic model name.
 * Returns null if no family can be determined.
 */
function extractFamily(model: string): string | null {
  if (/haiku/i.test(model)) return 'haiku'
  if (/opus/i.test(model)) return 'opus'
  if (/sonnet/i.test(model)) return 'sonnet'
  return null
}
