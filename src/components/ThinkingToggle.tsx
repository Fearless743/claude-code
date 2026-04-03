import * as React from 'react'
import { useState } from 'react'
import { useExitOnCtrlCDWithKeybindings } from 'src/hooks/useExitOnCtrlCDWithKeybindings.js'
import { useAppState } from 'src/state/AppState.js'
import { translate } from '../i18n/index.js'
import { Box, Text } from '../ink.js'
import { useKeybinding } from '../keybindings/useKeybinding.js'
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js'
import { Select } from './CustomSelect/index.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'
import { Pane } from './design-system/Pane.js'

export type Props = {
  currentValue: boolean
  onSelect: (enabled: boolean) => void
  onCancel?: () => void
  isMidConversation?: boolean
}

export function ThinkingToggle({
  currentValue,
  onSelect,
  onCancel,
  isMidConversation,
}: Props) {
  const exitState = useExitOnCtrlCDWithKeybindings()
  const uiLanguage = useAppState(s => s.settings.language)
  const [confirmationPending, setConfirmationPending] = useState<boolean | null>(null)

  const options = [
    {
      value: 'true',
      label: translate(uiLanguage, 'settings.enabledAction'),
      description: translate(uiLanguage, 'settings.thinkingToggleEnabledDescription'),
    },
    {
      value: 'false',
      label: translate(uiLanguage, 'settings.disabledAction'),
      description: translate(uiLanguage, 'settings.thinkingToggleDisabledDescription'),
    },
  ]

  useKeybinding(
    'confirm:no',
    () => {
      if (confirmationPending !== null) {
        setConfirmationPending(null)
      } else {
        onCancel?.()
      }
    },
    { context: 'Confirmation' },
  )

  useKeybinding(
    'confirm:yes',
    () => {
      if (confirmationPending !== null) {
        onSelect(confirmationPending)
      }
    },
    {
      context: 'Confirmation',
      isActive: confirmationPending !== null,
    },
  )

  function handleSelectChange(value: string) {
    const selected = value === 'true'
    if (isMidConversation && selected !== currentValue) {
      setConfirmationPending(selected)
    } else {
      onSelect(selected)
    }
  }

  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text color="remember" bold>
            {translate(uiLanguage, 'settings.thinkingToggleTitle')}
          </Text>
          <Text dimColor>
            {translate(uiLanguage, 'settings.thinkingToggleDescription')}
          </Text>
        </Box>

        {confirmationPending !== null ? (
          <Box flexDirection="column" marginBottom={1} gap={1}>
            <Text color="warning">
              {translate(uiLanguage, 'settings.thinkingToggleProceedWarning')}
            </Text>
            <Text color="warning">
              {translate(uiLanguage, 'settings.thinkingToggleProceedQuestion')}
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginBottom={1}>
            <Select
              defaultValue={currentValue ? 'true' : 'false'}
              defaultFocusValue={currentValue ? 'true' : 'false'}
              options={options}
              onChange={handleSelectChange}
              onCancel={onCancel ?? (() => {})}
              visibleOptionCount={2}
            />
          </Box>
        )}
      </Box>

      <Text dimColor italic>
        {exitState.pending ? (
          translate(uiLanguage, 'settings.pressAgainToExit', {
            key: exitState.keyName,
          })
        ) : confirmationPending !== null ? (
          <Byline>
            <KeyboardShortcutHint shortcut="Enter" action="confirm" />
            <ConfigurableShortcutHint
              action="confirm:no"
              context="Confirmation"
              fallback="Esc"
              description={translate(uiLanguage, 'settings.cancelAction')}
            />
          </Byline>
        ) : (
          <Byline>
            <KeyboardShortcutHint shortcut="Enter" action="confirm" />
            <ConfigurableShortcutHint
              action="confirm:no"
              context="Confirmation"
              fallback="Esc"
              description={translate(uiLanguage, 'settings.exitAction')}
            />
          </Byline>
        )}
      </Text>
    </Pane>
  )
}
