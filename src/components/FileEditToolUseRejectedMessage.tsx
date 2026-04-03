import type { StructuredPatchHunk } from 'diff';
import { relative } from 'path';
import * as React from 'react';
import { useAppState } from 'src/state/AppState.js';
import { translate } from 'src/i18n/index.js';
import { useTerminalSize } from 'src/hooks/useTerminalSize.js';
import { getCwd } from 'src/utils/cwd.js';
import { Box, Text } from '../ink.js';
import { HighlightedCode } from './HighlightedCode.js';
import { MessageResponse } from './MessageResponse.js';
import { StructuredDiffList } from './StructuredDiffList.js';

const MAX_LINES_TO_RENDER = 10;

type Props = {
  file_path: string;
  operation: 'write' | 'update';
  patch?: StructuredPatchHunk[];
  firstLine: string | null;
  fileContent?: string;
  content?: string;
  style?: 'condensed';
  verbose: boolean;
};

export function FileEditToolUseRejectedMessage({
  file_path,
  operation,
  patch,
  firstLine,
  fileContent,
  content,
  style,
  verbose,
}: Props) {
  const { columns } = useTerminalSize();
  const uiLanguage = useAppState(s => s.settings.language);

  const operationLabel =
    operation === 'write'
      ? translate(uiLanguage, 'settings.rejectedWriteTo')
      : translate(uiLanguage, 'settings.rejectedUpdateTo');

  const filePathDisplay = verbose ? file_path : relative(getCwd(), file_path);

  const text = (
    <Box flexDirection="row">
      <Text color="subtle">{operationLabel}</Text>
      <Text bold color="subtle">
        {filePathDisplay}
      </Text>
    </Box>
  );

  if (style === 'condensed' && !verbose) {
    return <MessageResponse>{text}</MessageResponse>;
  }

  if (operation === 'write' && content !== undefined) {
    const lines = content.split('\n');
    const numLines = lines.length;
    const plusLines = numLines - MAX_LINES_TO_RENDER;
    const truncatedContent = verbose ? content : lines.slice(0, MAX_LINES_TO_RENDER).join('\n');
    const contentDisplay = truncatedContent || translate(uiLanguage, 'settings.noContent');

    const codeWidth = columns - 12;

    return (
      <MessageResponse>
        <Box flexDirection="column">
          {text}
          <HighlightedCode code={contentDisplay} filePath={file_path} width={codeWidth} dim />
          {!verbose && plusLines > 0 && (
            <Text dimColor>… +{plusLines} {translate(uiLanguage, 'settings.linesLabel')}</Text>
          )}
        </Box>
      </MessageResponse>
    );
  }

  if (!patch || patch.length === 0) {
    return <MessageResponse>{text}</MessageResponse>;
  }

  const diffWidth = columns - 12;

  return (
    <MessageResponse>
      <Box flexDirection="column">
        {text}
        <StructuredDiffList
          hunks={patch}
          dim
          width={diffWidth}
          filePath={file_path}
          firstLine={firstLine}
          fileContent={fileContent}
        />
      </Box>
    </MessageResponse>
  );
}