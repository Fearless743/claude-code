import { c as _c } from "react/compiler-runtime";
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages/messages.mjs';
import * as React from 'react';
import { useAppState } from 'src/state/AppState.js';
import { stripUnderlineAnsi } from 'src/components/shell/OutputLine.js';
import { translate } from 'src/i18n/index.js';
import { extractTag } from 'src/utils/messages.js';
import { removeSandboxViolationTags } from 'src/utils/sandbox/sandbox-ui-utils.js';
import { Box, Text } from '../ink.js';
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
import { countCharInString } from '../utils/stringUtils.js';
import { MessageResponse } from './MessageResponse.js';
const MAX_RENDERED_LINES = 10;
type Props = {
  result: ToolResultBlockParam['content'];
  verbose: boolean;
};
export function FallbackToolUseErrorMessage({ result, verbose }: Props) {
  const transcriptShortcut = useShortcutDisplay('app:toggleTranscript', 'Global', 'ctrl+o');
  const uiLanguage = useAppState(s => s.settings.language);

  let error: string;
  if (typeof result !== 'string') {
    error = translate(uiLanguage, 'settings.toolExecutionFailed');
  } else {
    const extractedError = extractTag(result, 'tool_use_error') ?? result;
    const withoutSandboxViolations = removeSandboxViolationTags(extractedError);
    const withoutErrorTags = withoutSandboxViolations.replace(/<\/?error>/g, '');
    const trimmed = withoutErrorTags.trim();

    if (!verbose && trimmed.includes('InputValidationError: ')) {
      error = translate(uiLanguage, 'settings.invalidToolParameters');
    } else if (trimmed.startsWith('Error: ') || trimmed.startsWith('Cancelled: ')) {
      error = trimmed;
    } else {
      error = `${translate(uiLanguage, 'settings.errorPrefix')}: ${trimmed}`;
    }
  }

  const plusLines = countCharInString(error, '\n') + 1 - MAX_RENDERED_LINES;
  const renderedError = stripUnderlineAnsi(
    verbose ? error : error.split('\n').slice(0, MAX_RENDERED_LINES).join('\n'),
  );

  return (
    <MessageResponse>
      <Box flexDirection="column">
        <Text color="error">{renderedError}</Text>
        {!verbose && plusLines > 0 && (
          <Box>
            <Text dimColor>
              … +{plusLines} {plusLines === 1 ? translate(uiLanguage, 'settings.lineLabel') : translate(uiLanguage, 'settings.linesLabel')} (
            </Text>
            <Text dimColor bold>
              {transcriptShortcut}
            </Text>
            <Text dimColor>
              {' '}
              {translate(uiLanguage, 'settings.seeAllLinesSuffix', { shortcut: transcriptShortcut })}
            </Text>
          </Box>
        )}
      </Box>
    </MessageResponse>
  );
}
