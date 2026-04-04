import type { Command } from '../../commands.js'
import { isAnthropicOnlineServicesEnabled } from '../../utils/anthropicOnlineServices.js'

export default {
  type: 'local-jsx',
  name: 'remote-env',
  description: 'Configure the default remote environment for teleport sessions',
  isEnabled: () => isAnthropicOnlineServicesEnabled(),
  get isHidden() {
    return !isAnthropicOnlineServicesEnabled()
  },
  load: () => import('./remote-env.js'),
} satisfies Command
