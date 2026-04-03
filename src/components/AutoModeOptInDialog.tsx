import React from 'react';
import { logEvent } from 'src/services/analytics/index.js';
import { translate } from 'src/i18n/index.js';
import { useAppState } from 'src/state/AppState.js';
import { Box, Link, Text } from '../ink.js';
import { updateSettingsForSource } from '../utils/settings/settings.js';
import { Select } from './CustomSelect/index.js';
import { Dialog } from './design-system/Dialog.js';

type Props = {
  onAccept(): void;
  onDecline(): void;
  declineExits?: boolean;
};

export function AutoModeOptInDialog({ onAccept, onDecline, declineExits }: Props) {
  const uiLanguage = useAppState(s => s.settings.language);

  React.useEffect(() => {
    logEvent('tengu_auto_mode_opt_in_dialog_shown', {});
  }, []);

  function onChange(value: 'accept' | 'accept-default' | 'decline') {
    switch (value) {
      case 'accept':
        logEvent('tengu_auto_mode_opt_in_dialog_accept', {});
        updateSettingsForSource('userSettings', {
          skipAutoPermissionPrompt: true,
        });
        onAccept();
        break;
      case 'accept-default':
        logEvent('tengu_auto_mode_opt_in_dialog_accept_default', {});
        updateSettingsForSource('userSettings', {
          skipAutoPermissionPrompt: true,
          permissions: {
            defaultMode: 'auto',
          },
        });
        onAccept();
        break;
      case 'decline':
        logEvent('tengu_auto_mode_opt_in_dialog_decline', {});
        onDecline();
        break;
    }
  }

  const options = [
    {
      label: translate(uiLanguage, 'settings.autoModeOptInYesDefault'),
      value: 'accept-default' as const,
    },
    {
      label: translate(uiLanguage, 'settings.autoModeOptInYes'),
      value: 'accept' as const,
    },
    {
      label: declineExits
        ? translate(uiLanguage, 'settings.autoModeOptInNoExit')
        : translate(uiLanguage, 'settings.autoModeOptInNoBack'),
      value: 'decline' as const,
    },
  ];

  return (
    <Dialog
      title={translate(uiLanguage, 'settings.autoModeOptInTitle')}
      color="warning"
      onCancel={onDecline}
    >
      <Box flexDirection="column" gap={1}>
        <Text>{translate(uiLanguage, 'settings.autoModeOptInDescription')}</Text>
        <Link url="https://code.claude.com/docs/en/security" />
      </Box>
      <Select
        options={options}
        onChange={value => onChange(value as 'accept' | 'accept-default' | 'decline')}
        onCancel={onDecline}
      />
    </Dialog>
  );
}
