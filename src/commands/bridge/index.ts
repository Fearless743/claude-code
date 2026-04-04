import type { Command } from '../../commands.js'
import { isAnthropicOnlineServicesEnabled } from '../../utils/anthropicOnlineServices.js'

function isEnabled(): boolean {
  return isAnthropicOnlineServicesEnabled()
}

const bridge = {
  type: 'local-jsx',
  name: 'remote-control',
  aliases: ['rc'],
  description: 'Connect this terminal for remote-control sessions',
  argumentHint: '[name]',
  isEnabled,
  get isHidden() {
    return !isEnabled()
  },
  immediate: true,
  load: () => import('./bridge.js'),
} satisfies Command

export default bridge
