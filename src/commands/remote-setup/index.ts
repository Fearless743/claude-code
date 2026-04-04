import type { Command } from '../../commands.js'
import { isAnthropicOnlineServicesEnabled } from '../../utils/anthropicOnlineServices.js'

const web = {
  type: 'local-jsx',
  name: 'web-setup',
  description:
    'Setup Claude Code on the web (requires connecting your GitHub account)',
  availability: ['claude-ai'],
  isEnabled: () => isAnthropicOnlineServicesEnabled(),
  get isHidden() {
    return !isAnthropicOnlineServicesEnabled()
  },
  load: () => import('./remote-setup.js'),
} satisfies Command

export default web
