import type { Command } from '../../commands.js'
import { isAnthropicOnlineServicesEnabled } from '../../utils/anthropicOnlineServices.js'

export default {
  type: 'local-jsx',
  name: 'logout',
  description: 'Sign out from your Anthropic account',
  isEnabled: () => isAnthropicOnlineServicesEnabled(),
  get isHidden() {
    return !isAnthropicOnlineServicesEnabled()
  },
  load: () => import('./logout.js'),
} satisfies Command
