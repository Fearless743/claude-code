import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Text } from 'src/ink.js';
import { translate } from '../../i18n/index.js';
import type { BackgroundTaskState } from 'src/tasks/types.js';
import type { DeepImmutable } from 'src/types/utils.js';
import { truncate } from 'src/utils/format.js';
import { toInkColor } from 'src/utils/ink.js';
import { plural } from 'src/utils/stringUtils.js';
import { DIAMOND_FILLED, DIAMOND_OPEN } from '../../constants/figures.js';
import { RemoteSessionProgress } from './RemoteSessionProgress.js';
import { ShellProgress, TaskStatusText } from './ShellProgress.js';
import { describeTeammateActivity } from './taskStatusUtils.js';
type Props = {
  task: DeepImmutable<BackgroundTaskState>;
  maxActivityWidth?: number;
};
export function BackgroundTask(t0) {
  const $ = _c(92);
  const uiLanguage = process.env.CLAUDE_CODE_LANGUAGE;
  const {
    task,
    maxActivityWidth
  } = t0;
  const activityLimit = maxActivityWidth ?? 40;
  switch (task.type) {
    case "local_bash":
      {
        const t1 = task.kind === "monitor" ? task.description : task.command;
        let t2;
        if ($[0] !== activityLimit || $[1] !== t1) {
          t2 = truncate(t1, activityLimit, true);
          $[0] = activityLimit;
          $[1] = t1;
          $[2] = t2;
        } else {
          t2 = $[2];
        }
        let t3;
        if ($[3] !== task) {
          t3 = <ShellProgress shell={task} />;
          $[3] = task;
          $[4] = t3;
        } else {
          t3 = $[4];
        }
        let t4;
        if ($[5] !== t2 || $[6] !== t3) {
          t4 = <Text>{t2}{" "}{t3}</Text>;
          $[5] = t2;
          $[6] = t3;
          $[7] = t4;
        } else {
          t4 = $[7];
        }
        return t4;
      }
    case "remote_agent":
      {
        if (task.isRemoteReview) {
          let t1;
          if ($[8] !== task) {
            t1 = <Text><RemoteSessionProgress session={task} /></Text>;
            $[8] = task;
            $[9] = t1;
          } else {
            t1 = $[9];
          }
          return t1;
        }
        const running = task.status === "running" || task.status === "pending";
        const t1 = running ? DIAMOND_OPEN : DIAMOND_FILLED;
        let t2;
        if ($[10] !== t1) {
          t2 = <Text dimColor={true}>{t1} </Text>;
          $[10] = t1;
          $[11] = t2;
        } else {
          t2 = $[11];
        }
        let t3;
        if ($[12] !== activityLimit || $[13] !== task.title) {
          t3 = truncate(task.title, activityLimit, true);
          $[12] = activityLimit;
          $[13] = task.title;
          $[14] = t3;
        } else {
          t3 = $[14];
        }
        let t4;
        if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
          t4 = <Text dimColor={true}> · </Text>;
          $[15] = t4;
        } else {
          t4 = $[15];
        }
        let t5;
        if ($[16] !== task) {
          t5 = <RemoteSessionProgress session={task} />;
          $[16] = task;
          $[17] = t5;
        } else {
          t5 = $[17];
        }
        let t6;
        if ($[18] !== t2 || $[19] !== t3 || $[20] !== t5) {
          t6 = <Text>{t2}{t3}{t4}{t5}</Text>;
          $[18] = t2;
          $[19] = t3;
          $[20] = t5;
          $[21] = t6;
        } else {
          t6 = $[21];
        }
        return t6;
      }
    case "local_agent":
      {
        let t1;
        if ($[22] !== activityLimit || $[23] !== task.description) {
          t1 = truncate(task.description, activityLimit, true);
          $[22] = activityLimit;
          $[23] = task.description;
          $[24] = t1;
        } else {
          t1 = $[24];
        }
        const t2 = task.status === "completed" ? translate(uiLanguage, 'dialogs.backgroundTasksStatusDone') : undefined;
        const t3 = task.status === "completed" && !task.notified ? translate(uiLanguage, 'dialogs.backgroundTasksStatusUnreadSuffix') : undefined;
        let t4;
        if ($[25] !== t2 || $[26] !== t3 || $[27] !== task.status) {
          t4 = <TaskStatusText status={task.status} label={t2} suffix={t3} />;
          $[25] = t2;
          $[26] = t3;
          $[27] = task.status;
          $[28] = t4;
        } else {
          t4 = $[28];
        }
        let t5;
        if ($[29] !== t1 || $[30] !== t4) {
          t5 = <Text>{t1}{" "}{t4}</Text>;
          $[29] = t1;
          $[30] = t4;
          $[31] = t5;
        } else {
          t5 = $[31];
        }
        return t5;
      }
    case "in_process_teammate":
      {
        let T0;
        let T1;
        let t1;
        let t2;
        let t3;
        let t4;
        if ($[32] !== activityLimit || $[33] !== task) {
          const activity = describeTeammateActivity(task);
          T1 = Text;
          let t5;
          if ($[40] !== task.identity.color) {
            t5 = toInkColor(task.identity.color);
            $[40] = task.identity.color;
            $[41] = t5;
          } else {
            t5 = $[41];
          }
          if ($[42] !== t5 || $[43] !== task.identity.agentName) {
            t4 = <Text color={t5}>@{task.identity.agentName}</Text>;
            $[42] = t5;
            $[43] = task.identity.agentName;
            $[44] = t4;
          } else {
            t4 = $[44];
          }
          T0 = Text;
          t1 = true;
          t2 = ": ";
          t3 = truncate(activity, activityLimit, true);
          $[32] = activityLimit;
          $[33] = task;
          $[34] = T0;
          $[35] = T1;
          $[36] = t1;
          $[37] = t2;
          $[38] = t3;
          $[39] = t4;
        } else {
          T0 = $[34];
          T1 = $[35];
          t1 = $[36];
          t2 = $[37];
          t3 = $[38];
          t4 = $[39];
        }
        let t5;
        if ($[45] !== T0 || $[46] !== t1 || $[47] !== t2 || $[48] !== t3) {
          t5 = <T0 dimColor={t1}>{t2}{t3}</T0>;
          $[45] = T0;
          $[46] = t1;
          $[47] = t2;
          $[48] = t3;
          $[49] = t5;
        } else {
          t5 = $[49];
        }
        let t6;
        if ($[50] !== T1 || $[51] !== t4 || $[52] !== t5) {
          t6 = <T1>{t4}{t5}</T1>;
          $[50] = T1;
          $[51] = t4;
          $[52] = t5;
          $[53] = t6;
        } else {
          t6 = $[53];
        }
        return t6;
      }
    case "local_workflow":
      {
        const t1 = task.workflowName ?? task.summary ?? task.description;
        let t2;
        if ($[54] !== activityLimit || $[55] !== t1) {
          t2 = truncate(t1, activityLimit, true);
          $[54] = activityLimit;
          $[55] = t1;
          $[56] = t2;
        } else {
          t2 = $[56];
        }
        let t3;
        if ($[57] !== task.agentCount || $[58] !== task.status || $[59] !== uiLanguage) {
          t3 = task.status === "running" ? translate(uiLanguage, task.agentCount === 1 ? 'dialogs.backgroundTasksAgentCountOne' : 'dialogs.backgroundTasksAgentCountMany', {
            count: task.agentCount
          }) : task.status === "completed" ? translate(uiLanguage, 'dialogs.backgroundTasksStatusDone') : undefined;
          $[57] = task.agentCount;
          $[58] = task.status;
          $[59] = uiLanguage;
          $[60] = t3;
        } else {
          t3 = $[60];
        }
        const t4 = task.status === "completed" && !task.notified ? translate(uiLanguage, 'dialogs.backgroundTasksStatusUnreadSuffix') : undefined;
        let t5;
        if ($[61] !== t3 || $[62] !== t4 || $[63] !== task.status) {
          t5 = <TaskStatusText status={task.status} label={t3} suffix={t4} />;
          $[61] = t3;
          $[62] = t4;
          $[63] = task.status;
          $[64] = t5;
        } else {
          t5 = $[64];
        }
        let t6;
        if ($[65] !== t2 || $[66] !== t5) {
          t6 = <Text>{t2}{" "}{t5}</Text>;
          $[65] = t2;
          $[66] = t5;
          $[67] = t6;
        } else {
          t6 = $[67];
        }
        return t6;
      }
    case "monitor_mcp":
      {
        let t1;
        if ($[67] !== activityLimit || $[68] !== task.description) {
          t1 = truncate(task.description, activityLimit, true);
          $[67] = activityLimit;
          $[68] = task.description;
          $[69] = t1;
        } else {
          t1 = $[69];
        }
        const t2 = task.status === "completed" ? translate(uiLanguage, 'dialogs.backgroundTasksStatusDone') : undefined;
        const t3 = task.status === "completed" && !task.notified ? translate(uiLanguage, 'dialogs.backgroundTasksStatusUnreadSuffix') : undefined;
        let t4;
        if ($[70] !== t2 || $[71] !== t3 || $[72] !== task.status) {
          t4 = <TaskStatusText status={task.status} label={t2} suffix={t3} />;
          $[70] = t2;
          $[71] = t3;
          $[72] = task.status;
          $[73] = t4;
        } else {
          t4 = $[73];
        }
        let t5;
        if ($[74] !== t1 || $[75] !== t4) {
          t5 = <Text>{t1}{" "}{t4}</Text>;
          $[74] = t1;
          $[75] = t4;
          $[76] = t5;
        } else {
          t5 = $[76];
        }
        return t5;
      }
    case "dream":
      {
        const n = task.filesTouched.length;
        let t1;
        if ($[77] !== n || $[78] !== task.phase || $[79] !== task.sessionsReviewing || $[80] !== uiLanguage) {
          t1 = task.phase === "updating" && n > 0 ? translate(uiLanguage, n === 1 ? 'dialogs.backgroundTasksDreamFileCountOne' : 'dialogs.backgroundTasksDreamFileCountMany', {
            count: n
          }) : translate(uiLanguage, task.sessionsReviewing === 1 ? 'dialogs.backgroundTasksDreamSessionCountOne' : 'dialogs.backgroundTasksDreamSessionCountMany', {
            count: task.sessionsReviewing
          });
          $[77] = n;
          $[78] = task.phase;
          $[79] = task.sessionsReviewing;
          $[80] = uiLanguage;
          $[81] = t1;
        } else {
          t1 = $[81];
        }
        const detail = t1;
        let t2;
        if ($[82] !== detail || $[83] !== task.phase || $[84] !== uiLanguage) {
          t2 = <Text dimColor={true}>· {translate(uiLanguage, `dialogs.backgroundTasksDreamPhase${task.phase === 'updating' ? 'Updating' : 'Reviewing'}`)} · {detail}</Text>;
          $[82] = detail;
          $[83] = task.phase;
          $[84] = uiLanguage;
          $[85] = t2;
        } else {
          t2 = $[85];
        }
        const t3 = task.status === "completed" ? translate(uiLanguage, 'dialogs.backgroundTasksStatusDone') : undefined;
        const t4 = task.status === "completed" && !task.notified ? translate(uiLanguage, 'dialogs.backgroundTasksStatusUnreadSuffix') : undefined;
        let t5;
        if ($[86] !== t3 || $[87] !== t4 || $[88] !== task.status) {
          t5 = <TaskStatusText status={task.status} label={t3} suffix={t4} />;
          $[86] = t3;
          $[87] = t4;
          $[88] = task.status;
          $[89] = t5;
        } else {
          t5 = $[89];
        }
        let t6;
        if ($[90] !== t2 || $[91] !== t5 || $[92] !== task.description) {
          t6 = <Text>{task.description}{" "}{t2}{" "}{t5}</Text>;
          $[90] = t2;
          $[91] = t5;
          $[92] = task.description;
          $[93] = t6;
        } else {
          t6 = $[93];
        }
        return t6;
      }
  }
}
