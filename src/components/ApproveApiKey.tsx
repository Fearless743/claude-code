import React from 'react';
import { useAppState } from 'src/state/AppState.js';
import { translate } from 'src/i18n/index.js';
import { Text } from '../ink.js';
import { saveGlobalConfig } from '../utils/config.js';
import { Select } from './CustomSelect/index.js';
import { Dialog } from './design-system/Dialog.js';

type Props = {
  customApiKeyTruncated: string;
  onDone(approved: boolean): void;
};

export function ApproveApiKey({ customApiKeyTruncated, onDone }: Props) {
  const uiLanguage = useAppState(s => s.settings.language);

  function onChange(value: string) {
    switch (value) {
      case 'yes':
        saveGlobalConfig(current => ({
          ...current,
          customApiKeyResponses: {
            ...current.customApiKeyResponses,
            approved: [...(current.customApiKeyResponses?.approved ?? []), customApiKeyTruncated],
          },
        }));
        onDone(true);
        break;
      case 'no':
        saveGlobalConfig(current => ({
          ...current,
          customApiKeyResponses: {
            ...current.customApiKeyResponses,
            rejected: [...(current.customApiKeyResponses?.rejected ?? []), customApiKeyTruncated],
          },
        }));
        onDone(false);
        break;
    }
  }

  const onCancel = () => onChange('no');

  return (
    <Dialog title={translate(uiLanguage, 'settings.customApiKeyDetectedTitle')} color="warning" onCancel={onCancel}>
      <Text bold>ANTHROPIC_API_KEY</Text>
      <Text>: sk-ant-...{customApiKeyTruncated}</Text>
      <Text>{translate(uiLanguage, 'settings.customApiKeyUseQuestion')}</Text>
      <Select
        defaultValue="no"
        defaultFocusValue="no"
        options={[
          {
            label: translate(uiLanguage, 'settings.yesAction'),
            value: 'yes',
          },
          {
            label: (
              <Text>
                {translate(uiLanguage, 'settings.noRecommendedAction', {
                  recommended: translate(uiLanguage, 'settings.recommendedLabel'),
                })}
              </Text>
            ),
            value: 'no',
          },
        ]}
        onChange={value => onChange(value as 'yes' | 'no')}
        onCancel={() => onChange('no')}
      />
    </Dialog>
  );
}