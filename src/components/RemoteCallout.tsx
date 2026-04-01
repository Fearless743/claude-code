import React, { useCallback, useEffect, useRef } from 'react';
import { isBridgeEnabled } from '../bridge/bridgeEnabled.js';
import { Box, Text } from '../ink.js';
import { translate } from '../i18n/index.js';
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
import type { OptionWithDescription } from './CustomSelect/select.js';
import { Select } from './CustomSelect/select.js';
import { PermissionDialog } from './permissions/PermissionDialog.js';
type RemoteCalloutSelection = 'enable' | 'dismiss';
type Props = {
  onDone: (selection: RemoteCalloutSelection) => void;
};
export function RemoteCallout({
  onDone
}: Props): React.ReactNode {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const handleCancel = useCallback((): void => {
    onDoneRef.current('dismiss');
  }, []);

  // Permanently mark as seen on mount so it only shows once
  useEffect(() => {
    saveGlobalConfig(current => {
      if (current.remoteDialogSeen) return current;
      return {
        ...current,
        remoteDialogSeen: true
      };
    });
  }, []);
  const handleSelect = useCallback((value: RemoteCalloutSelection): void => {
    onDoneRef.current(value);
  }, []);
  const options: OptionWithDescription<RemoteCalloutSelection>[] = [{
    label: translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteCalloutEnable'),
    description: translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteCalloutEnableDescription'),
    value: 'enable'
  }, {
    label: translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteCalloutDismiss'),
    description: translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteCalloutDismissDescription'),
    value: 'dismiss'
  }];
  return <PermissionDialog title={translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteCalloutTitle')}>
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1} flexDirection="column">
          <Text>
            {translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteCalloutIntro')}
          </Text>
          <Text> </Text>
          <Text>
            {translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteCalloutOutro')}
          </Text>
        </Box>
        <Box>
          <Select options={options} onChange={handleSelect} onCancel={handleCancel} />
        </Box>
      </Box>
    </PermissionDialog>;
}

/**
 * Check whether to show the remote callout (first-time dialog).
 */
export function shouldShowRemoteCallout(): boolean {
  const config = getGlobalConfig();
  if (config.remoteDialogSeen) return false;
  if (!isBridgeEnabled()) return false;
  const tokens = getClaudeAIOAuthTokens();
  if (!tokens?.accessToken) return false;
  return true;
}
