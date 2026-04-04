import type { Command } from '../../commands.js'
import { isAnthropicOnlineServicesEnabled } from '../../utils/anthropicOnlineServices.js'

const installGitHubApp = {
  type: 'local-jsx',
  name: 'install-github-app',
  description: 'Anthropic GitHub app setup is unavailable in this build',
  availability: ['claude-ai', 'console'],
  isEnabled: () => isAnthropicOnlineServicesEnabled(),
  get isHidden() {
    return !isAnthropicOnlineServicesEnabled()
  },
  load: () => import('./install-github-app.js'),
} satisfies Command

export default installGitHubApp
