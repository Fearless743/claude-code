import capitalize from 'lodash-es/capitalize.js'
import type { SettingSource } from 'src/utils/settings/constants.js'
import { getSettingSourceName } from 'src/utils/settings/constants.js'
import { translate } from '../../i18n/index.js'

export function getAgentSourceDisplayName(
  source: SettingSource | 'all' | 'built-in' | 'plugin',
): string {
  const uiLanguage = process.env.CLAUDE_CODE_LANGUAGE
  if (source === 'all') {
    return translate(uiLanguage, 'agents.title')
  }
  if (source === 'built-in') {
    return translate(uiLanguage, 'agents.builtInAgentsTitle')
  }
  if (source === 'plugin') {
    return translate(uiLanguage, 'agents.pluginAgentsTitle')
  }
  return capitalize(getSettingSourceName(source))
}
