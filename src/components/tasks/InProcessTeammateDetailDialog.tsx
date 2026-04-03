import { c as _c } from "react/compiler-runtime";
import React, { useMemo } from 'react';
import type { DeepImmutable } from 'src/types/utils.js';
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
import { Box, Text, useTheme } from '../../ink.js';
import { useKeybindings } from '../../keybindings/useKeybinding.js';
import { translate } from '../../i18n/index.js';
import { getEmptyToolPermissionContext } from '../../Tool.js';
import type { InProcessTeammateTaskState } from '../../tasks/InProcessTeammateTask/types.js';
import { getTools } from '../../tools.js';
import { formatNumber, truncateToWidth } from '../../utils/format.js';
import { toInkColor } from '../../utils/ink.js';
import { Byline } from '../design-system/Byline.js';
import { Dialog } from '../design-system/Dialog.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { renderToolActivity } from './renderToolActivity.js';
import { describeTeammateActivity } from './taskStatusUtils.js';
type Props = {
  teammate: DeepImmutable<InProcessTeammateTaskState>;
  onDone: () => void;
  onKill?: () => void;
  onBack?: () => void;
  onForeground?: () => void;
};
export function InProcessTeammateDetailDialog(t0) {
  const $ = _c(63);
  const {
    teammate,
    onDone,
    onKill,
    onBack,
    onForeground
  } = t0;
  const [theme] = useTheme();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getTools(getEmptyToolPermissionContext());
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const tools = t1;
  const uiLanguage = process.env.CLAUDE_CODE_LANGUAGE;
  const elapsedTime = useElapsedTime(teammate.startTime, teammate.status === "running", 1000, teammate.totalPausedMs ?? 0);
  let t2;
  if ($[1] !== onDone) {
    t2 = {
      "confirm:yes": onDone
    };
    $[1] = onDone;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = {
      context: "Confirmation"
    };
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  useKeybindings(t2, t3);
  let t4;
  if ($[4] !== onBack || $[5] !== onDone || $[6] !== onForeground || $[7] !== onKill || $[8] !== teammate.status) {
    t4 = e => {
      if (e.key === " ") {
        e.preventDefault();
        onDone();
      } else {
        if (e.key === "left" && onBack) {
          e.preventDefault();
          onBack();
        } else {
          if (e.key === "x" && teammate.status === "running" && onKill) {
            e.preventDefault();
            onKill();
          } else {
            if (e.key === "f" && teammate.status === "running" && onForeground) {
              e.preventDefault();
              onForeground();
            }
          }
        }
      }
    };
    $[4] = onBack;
    $[5] = onDone;
    $[6] = onForeground;
    $[7] = onKill;
    $[8] = teammate.status;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const handleKeyDown = t4;
  let t5;
  if ($[10] !== teammate) {
    t5 = describeTeammateActivity(teammate);
    $[10] = teammate;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const activity = t5;
  const tokenCount = teammate.result?.totalTokens ?? teammate.progress?.tokenCount;
  const toolUseCount = teammate.result?.totalToolUseCount ?? teammate.progress?.toolUseCount;
  let t6;
  if ($[12] !== teammate.prompt) {
    t6 = truncateToWidth(teammate.prompt, 300);
    $[12] = teammate.prompt;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  const displayPrompt = t6;
  let t7;
  if ($[14] !== teammate.identity.color) {
    t7 = toInkColor(teammate.identity.color);
    $[14] = teammate.identity.color;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== t7 || $[17] !== teammate.identity.agentName) {
    t8 = <Text color={t7}>@{teammate.identity.agentName}</Text>;
    $[16] = t7;
    $[17] = teammate.identity.agentName;
    $[18] = t8;
  } else {
    t8 = $[18];
  }
  let t9;
  if ($[19] !== activity) {
    t9 = activity && <Text dimColor={true}> ({activity})</Text>;
    $[19] = activity;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  let t10;
  if ($[21] !== t8 || $[22] !== t9) {
    t10 = <Text>{t8}{t9}</Text>;
    $[21] = t8;
    $[22] = t9;
    $[23] = t10;
  } else {
    t10 = $[23];
  }
  const title = t10;
  let t11;
  if ($[24] !== teammate.status || $[25] !== uiLanguage) {
    t11 = teammate.status !== "running" && <Text color={teammate.status === "completed" ? "success" : teammate.status === "killed" ? "warning" : "error"}>{teammate.status === "completed" ? translate(uiLanguage, 'dialogs.taskDetailCompleted') : teammate.status === "failed" ? translate(uiLanguage, 'dialogs.taskDetailFailed') : translate(uiLanguage, 'dialogs.taskDetailStopped')}<Text dimColor={true}>{" \xB7 "}</Text></Text>;
    $[24] = teammate.status;
    $[25] = uiLanguage;
    $[26] = t11;
  } else {
    t11 = $[26];
  }
  let t12;
  if ($[27] !== tokenCount || $[28] !== uiLanguage) {
    t12 = tokenCount !== undefined && tokenCount > 0 && <>{translate(uiLanguage, 'dialogs.taskDetailTokenCount', {
      count: formatNumber(tokenCount)
    })}</>;
    $[27] = tokenCount;
    $[28] = uiLanguage;
    $[29] = t12;
  } else {
    t12 = $[29];
  }
  let t13;
  if ($[30] !== toolUseCount || $[31] !== uiLanguage) {
    t13 = toolUseCount !== undefined && toolUseCount > 0 && <> {translate(uiLanguage, toolUseCount === 1 ? 'dialogs.taskDetailToolCountOne' : 'dialogs.taskDetailToolCountMany', {
      count: toolUseCount
    })}</>;
    $[30] = toolUseCount;
    $[31] = uiLanguage;
    $[32] = t13;
  } else {
    t13 = $[32];
  }
  let t14;
  if ($[33] !== elapsedTime || $[34] !== t12 || $[35] !== t13) {
    t14 = <Text dimColor={true}>{elapsedTime}{t12}{t13}</Text>;
    $[33] = elapsedTime;
    $[34] = t12;
    $[35] = t13;
    $[36] = t14;
  } else {
    t14 = $[36];
  }
  let t15;
  if ($[37] !== t11 || $[38] !== t14) {
    t15 = <Text>{t11}{t14}</Text>;
    $[37] = t11;
    $[38] = t14;
    $[39] = t15;
  } else {
    t15 = $[39];
  }
  const subtitle = t15;
  let t16;
  if ($[40] !== onBack || $[41] !== onForeground || $[42] !== onKill || $[43] !== teammate.status || $[44] !== uiLanguage) {
    t16 = exitState => exitState.pending ? <Text>{translate(uiLanguage, 'dialogs.taskDetailPressAgainToExit', {
      key: exitState.keyName
    })}</Text> : <Byline>{onBack && <KeyboardShortcutHint shortcut={"\u2190"} action={translate(uiLanguage, 'dialogs.taskDetailGoBackAction')} />}<KeyboardShortcutHint shortcut="Esc/Enter/Space" action={translate(uiLanguage, 'dialogs.taskDetailCloseAction')} />{teammate.status === "running" && onKill && <KeyboardShortcutHint shortcut="x" action={translate(uiLanguage, 'dialogs.taskDetailStopAction')} />}{teammate.status === "running" && onForeground && <KeyboardShortcutHint shortcut="f" action={translate(uiLanguage, 'dialogs.backgroundTasksActionForeground')} />}</Byline>;
    $[40] = onBack;
    $[41] = onForeground;
    $[42] = onKill;
    $[43] = teammate.status;
    $[44] = uiLanguage;
    $[45] = t16;
  } else {
    t16 = $[45];
  }
  let t17;
  if ($[46] !== teammate.progress || $[47] !== teammate.status || $[48] !== theme || $[49] !== uiLanguage) {
    t17 = teammate.status === "running" && teammate.progress?.recentActivities && teammate.progress.recentActivities.length > 0 && <Box flexDirection="column"><Text bold={true} dimColor={true}>{translate(uiLanguage, 'dialogs.taskDetailProgressTitle')}</Text>{teammate.progress.recentActivities.map((activity_0, i) => <Text key={i} dimColor={i < teammate.progress.recentActivities.length - 1} wrap="truncate-end">{i === teammate.progress.recentActivities.length - 1 ? "\u203A " : "  "}{renderToolActivity(activity_0, tools, theme)}</Text>)}</Box>;
    $[46] = teammate.progress;
    $[47] = teammate.status;
    $[48] = theme;
    $[49] = uiLanguage;
    $[50] = t17;
  } else {
    t17 = $[50];
  }
  let t18;
  if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
    t18 = <Text bold={true} dimColor={true}>{translate(uiLanguage, 'dialogs.taskDetailPromptTitle')}</Text>;
    $[51] = t18;
  } else {
    t18 = $[51];
  }
  let t19;
  if ($[52] !== displayPrompt) {
    t19 = <Box flexDirection="column" marginTop={1}>{t18}<Text wrap="wrap">{displayPrompt}</Text></Box>;
    $[52] = displayPrompt;
    $[53] = t19;
  } else {
    t19 = $[53];
  }
  let t20;
  if ($[54] !== teammate.error || $[55] !== teammate.status || $[56] !== uiLanguage) {
    t20 = teammate.status === "failed" && teammate.error && <Box flexDirection="column" marginTop={1}><Text bold={true} color="error">{translate(uiLanguage, 'dialogs.taskDetailErrorTitle')}</Text><Text color="error" wrap="wrap">{teammate.error}</Text></Box>;
    $[54] = teammate.error;
    $[55] = teammate.status;
    $[56] = uiLanguage;
    $[57] = t20;
  } else {
    t20 = $[57];
  }
  let t21;
  if ($[58] !== onDone || $[59] !== subtitle || $[60] !== t16 || $[61] !== t17 || $[62] !== t19 || $[63] !== t20 || $[64] !== title) {
    t21 = <Dialog title={title} subtitle={subtitle} onCancel={onDone} color="background" inputGuide={t16}>{t17}{t19}{t20}</Dialog>;
    $[58] = onDone;
    $[59] = subtitle;
    $[60] = t16;
    $[61] = t17;
    $[62] = t19;
    $[63] = t20;
    $[64] = title;
    $[65] = t21;
  } else {
    t21 = $[65];
  }
  let t22;
  if ($[66] !== handleKeyDown || $[67] !== t21) {
    t22 = <Box flexDirection="column" tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t21}</Box>;
    $[66] = handleKeyDown;
    $[67] = t21;
    $[68] = t22;
  } else {
    t22 = $[68];
  }
  return t22;
}
