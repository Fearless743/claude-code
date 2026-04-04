const DISABLED_MESSAGE =
  'Anthropic online services have been removed from this build.'

export function isAnthropicOnlineServicesEnabled(): boolean {
  return false
}

export function getAnthropicOnlineServicesDisabledMessage(
  service?: string,
): string {
  return service
    ? `${service} is unavailable. ${DISABLED_MESSAGE}`
    : DISABLED_MESSAGE
}

export function assertAnthropicOnlineServicesEnabled(service?: string): void {
  if (!isAnthropicOnlineServicesEnabled()) {
    throw new Error(getAnthropicOnlineServicesDisabledMessage(service))
  }
}
