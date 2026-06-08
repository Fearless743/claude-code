/**
 * Model resolution for Command Code provider.
 *
 * CC models are fetched dynamically from the API (via providerModelList.ts).
 * This function simply passes through the model name as-is, since users
 * select from the dynamically fetched model list.
 */

/**
 * Resolve model name for Command Code.
 * Returns the model name unchanged — CC models are selected from the
 * dynamic model list fetched from the API.
 */
export function resolveCommandCodeModel(model: string): string {
  return model
}
