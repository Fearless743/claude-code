/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import { getAnthropicOnlineServicesDisabledMessage } from '../../utils/anthropicOnlineServices.js'

function exitUnavailable(service: string): never {
  process.stderr.write(
    `${getAnthropicOnlineServicesDisabledMessage(service)}\n`,
  )
  process.exit(1)
}

export async function installOAuthTokens(): Promise<void> {
  exitUnavailable('OAuth token installation')
}

export async function authLogin(): Promise<void> {
  exitUnavailable('Anthropic authentication')
}

export async function authStatus(): Promise<void> {
  exitUnavailable('Anthropic authentication')
}

export async function authLogout(): Promise<void> {
  exitUnavailable('Anthropic authentication')
}
