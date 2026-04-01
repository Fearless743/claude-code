import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { BLACK_CIRCLE } from '../constants/figures.js';
import { translate } from '../i18n/index.js';
import { Box, Text } from '../ink.js';
import type { Screen } from '../screens/REPL.js';
import { useAppState } from '../state/AppState.js';
import type { NormalizedUserMessage } from '../types/message.js';
import { getUserMessageText } from '../utils/messages.js';
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
import { MessageResponse } from './MessageResponse.js';

type Props = {
  message: NormalizedUserMessage;
  screen: Screen;
};

export function CompactSummary(t0) {
  const $ = _c(26);
  const {
    message,
    screen
  } = t0;
  const uiLanguage = useAppState(s => s.settings.language);
  const isTranscriptMode = screen === "transcript";
  let t1;
  if ($[0] !== message) {
    t1 = getUserMessageText(message) || "";
    $[0] = message;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const textContent = t1;
  const metadata = message.summarizeMetadata;
  if (metadata) {
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = <Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text></Box>;
      $[2] = t2;
    } else {
      t2 = $[2];
    }
    let t3;
    if ($[3] !== uiLanguage) {
      t3 = <Text bold={true}>{translate(uiLanguage, 'compactSummary.summarizedConversation')}</Text>;
      $[3] = uiLanguage;
      $[4] = t3;
    } else {
      t3 = $[4];
    }
    let t4;
    if ($[5] !== isTranscriptMode || $[6] !== metadata || $[7] !== uiLanguage) {
      t4 = !isTranscriptMode && <MessageResponse><Box flexDirection="column"><Text dimColor={true}>{translate(uiLanguage, 'compactSummary.summarizedMessages', {
        count: metadata.messagesSummarized,
        range: metadata.direction === "up_to" ? translate(uiLanguage, 'compactSummary.upToThisPoint') : translate(uiLanguage, 'compactSummary.fromThisPoint')
      })}</Text>{metadata.userContext && <Text dimColor={true}>{translate(uiLanguage, 'compactSummary.context', {
        context: metadata.userContext
      })}</Text>}<Text dimColor={true}><ConfigurableShortcutHint action="app:toggleTranscript" context="Global" fallback="ctrl+o" description={translate(uiLanguage, 'compactSummary.expandHistory')} parens={true} /></Text></Box></MessageResponse>;
      $[5] = isTranscriptMode;
      $[6] = metadata;
      $[7] = uiLanguage;
      $[8] = t4;
    } else {
      t4 = $[8];
    }
    let t5;
    if ($[9] !== isTranscriptMode || $[10] !== textContent) {
      t5 = isTranscriptMode && <MessageResponse><Text>{textContent}</Text></MessageResponse>;
      $[9] = isTranscriptMode;
      $[10] = textContent;
      $[11] = t5;
    } else {
      t5 = $[11];
    }
    let t6;
    if ($[12] !== t4 || $[13] !== t5) {
      t6 = <Box flexDirection="column" marginTop={1}><Box flexDirection="row">{t2}<Box flexDirection="column">{t3}{t4}{t5}</Box></Box></Box>;
      $[12] = t4;
      $[13] = t5;
      $[14] = t6;
    } else {
      t6 = $[14];
    }
    return t6;
  }
  let t2;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text></Box>;
    $[15] = t2;
  } else {
    t2 = $[15];
  }
  let t3;
  if ($[16] !== isTranscriptMode || $[17] !== uiLanguage) {
    t3 = !isTranscriptMode && <Text dimColor={true}>{" "}<ConfigurableShortcutHint action="app:toggleTranscript" context="Global" fallback="ctrl+o" description={translate(uiLanguage, 'compactSummary.expand')} parens={true} /></Text>;
    $[16] = isTranscriptMode;
    $[17] = uiLanguage;
    $[18] = t3;
  } else {
    t3 = $[18];
  }
  let t4;
  if ($[19] !== t3 || $[20] !== uiLanguage) {
    t4 = <Box flexDirection="row">{t2}<Box flexDirection="column"><Text bold={true}>{translate(uiLanguage, 'compactSummary.title')}{t3}</Text></Box></Box>;
    $[19] = t3;
    $[20] = uiLanguage;
    $[21] = t4;
  } else {
    t4 = $[21];
  }
  let t5;
  if ($[22] !== isTranscriptMode || $[23] !== textContent) {
    t5 = isTranscriptMode && <MessageResponse><Text>{textContent}</Text></MessageResponse>;
    $[22] = isTranscriptMode;
    $[23] = textContent;
    $[24] = t5;
  } else {
    t5 = $[24];
  }
  let t6;
  if ($[25] !== t4 || $[26] !== t5) {
    t6 = <Box flexDirection="column" marginTop={1}>{t4}{t5}</Box>;
    $[25] = t4;
    $[26] = t5;
    $[27] = t6;
  } else {
    t6 = $[27];
  }
  return t6;
}
