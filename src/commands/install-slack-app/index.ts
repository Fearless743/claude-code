import type { Command } from '../../commands.js'
import { isAnthropicOnlineServicesEnabled } from '../../utils/anthropicOnlineServices.js'

const installSlackApp = {
  type: 'local',
  name: 'install-slack-app',
  description: 'Anthropic Slack app setup is unavailable in this build',
  availability: ['claude-ai'],
  supportsNonInteractive: false,
  isEnabled: () => isAnthropicOnlineServicesEnabled(),
  get isHidden() {
    return !isAnthropicOnlineServicesEnabled()
  },
  load: () => import('./install-slack-app.js'),
} satisfies Command

export default installSlackApp
