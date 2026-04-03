import { c as _c } from "react/compiler-runtime";
import React, { useRef } from 'react';
import type { RemoteAgentTaskState } from 'src/tasks/RemoteAgentTask/RemoteAgentTask.js';
import type { DeepImmutable } from 'src/types/utils.js';
import { DIAMOND_FILLED, DIAMOND_OPEN } from '../../constants/figures.js';
import { useSettings } from '../../hooks/useSettings.js';
import { Text, useAnimationFrame } from '../../ink.js';
import { count } from '../../utils/array.js';
import { translate } from '../../i18n/index.js';
import { getRainbowColor } from '../../utils/thinking.js';
const TICK_MS = 80;
type ReviewStage = NonNullable<NonNullable<RemoteAgentTaskState['reviewProgress']>['stage']>;

/**
 * Stage-appropriate counts line for a running review. Shared between the
 * one-line pill (below) and RemoteSessionDetailDialog's reviewCountsLine so
 * the two can't drift — they have historically disagreed on whether to show
 * refuted counts and what to call the synthesizing stage.
 *
 * Canonical behavior: word labels (not ✓/✗), hide refuted when 0, "deduping"
 * for the synthesizing stage (matches STAGE_LABELS in the detail dialog).
 */
export function formatReviewStageCounts(stage: ReviewStage | undefined, found: number, verified: number, refuted: number): string {
  const uiLanguage = process.env.CLAUDE_CODE_LANGUAGE;
  // Pre-stage orchestrator images don't write the stage field.
  if (!stage) {
    return translate(uiLanguage, 'dialogs.remoteSessionReviewCountsFoundVerified', {
      found,
      verified
    });
  }
  if (stage === 'synthesizing') {
    const parts = [translate(uiLanguage, 'dialogs.remoteSessionReviewCountsVerified', {
      count: verified
    })];
    if (refuted > 0) parts.push(translate(uiLanguage, 'dialogs.remoteSessionRefuted', {
      count: refuted
    }));
    parts.push(translate(uiLanguage, 'dialogs.remoteSessionReviewDeduping'));
    return parts.join(' · ');
  }
  if (stage === 'verifying') {
    const parts = [translate(uiLanguage, 'dialogs.remoteSessionReviewCountsFound', {
      count: found
    }), translate(uiLanguage, 'dialogs.remoteSessionReviewCountsVerified', {
      count: verified
    })];
    if (refuted > 0) parts.push(translate(uiLanguage, 'dialogs.remoteSessionRefuted', {
      count: refuted
    }));
    return parts.join(' · ');
  }
  // stage === 'finding'
  return found > 0 ? translate(uiLanguage, 'dialogs.remoteSessionReviewCountsFound', {
    count: found
  }) : translate(uiLanguage, 'dialogs.remoteSessionReviewFinding');
}

// Per-character rainbow gradient, same treatment as the ultraplan keyword.
// The phase offset lets the gradient cycle — so the colors sweep along the
// text on each animation frame instead of being static.
function RainbowText(t0) {
  const $ = _c(5);
  const {
    text,
    phase: t1
  } = t0;
  const phase = t1 === undefined ? 0 : t1;
  let t2;
  if ($[0] !== text) {
    t2 = [...text];
    $[0] = text;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== phase || $[3] !== t2) {
    t3 = <>{t2.map((ch, i) => <Text key={i} color={getRainbowColor(i + phase)}>{ch}</Text>)}</>;
    $[2] = phase;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

// Smooth-tick a count toward target, +1 per frame. Same pattern as the
// token counter in SpinnerAnimationRow — the ref survives re-renders and
// the animation clock drives the tick. Target jumps (2→5) display as
// 2→3→4→5 instead of snapping. When `snap` is set (reduced motion, or
// the clock is frozen), bypass the tick and jump straight to target —
// otherwise a frozen `time` would leave the ref stuck at its init value.
function useSmoothCount(target: number, time: number, snap: boolean): number {
  const displayed = useRef(target);
  const lastTick = useRef(time);
  if (snap || target < displayed.current) {
    displayed.current = target;
  } else if (target > displayed.current && time !== lastTick.current) {
    displayed.current += 1;
    lastTick.current = time;
  }
  return displayed.current;
}
function ReviewRainbowLine(t0) {
  const $ = _c(15);
  const {
    session
  } = t0;
  const settings = useSettings();
  const reducedMotion = settings.prefersReducedMotion ?? false;
  const p = session.reviewProgress;
  const running = session.status === "running";
  const [, time] = useAnimationFrame(running && !reducedMotion ? TICK_MS : null);
  const targetFound = p?.bugsFound ?? 0;
  const targetVerified = p?.bugsVerified ?? 0;
  const targetRefuted = p?.bugsRefuted ?? 0;
  const snap = reducedMotion || !running;
  const found = useSmoothCount(targetFound, time, snap);
  const verified = useSmoothCount(targetVerified, time, snap);
  const refuted = useSmoothCount(targetRefuted, time, snap);
  const phase = Math.floor(time / (TICK_MS * 3)) % 7;
  if (session.status === "completed") {
    let t1;
    if ($[0] !== process.env.CLAUDE_CODE_LANGUAGE) {
      t1 = <><Text color="background">{DIAMOND_FILLED} </Text><RainbowText text={translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteSessionUltrareviewLabel')} phase={0} /><Text dimColor={true}> {translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteSessionReviewReadyToView')}</Text></>;
      $[0] = process.env.CLAUDE_CODE_LANGUAGE;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    return t1;
  }
  if (session.status === "failed") {
    let t1;
    if ($[2] !== process.env.CLAUDE_CODE_LANGUAGE) {
      t1 = <><Text color="background">{DIAMOND_FILLED} </Text><RainbowText text={translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteSessionUltrareviewLabel')} phase={0} /><Text color="error" dimColor={true}>{" \xB7 "}{translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.backgroundTasksStatusError')}</Text></>;
      $[2] = process.env.CLAUDE_CODE_LANGUAGE;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    return t1;
  }
  let t1;
  if ($[4] !== found || $[5] !== p || $[6] !== refuted || $[7] !== verified) {
    t1 = !p ? translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteSessionReviewSettingUp') : formatReviewStageCounts(p.stage, found, verified, refuted);
    $[4] = found;
    $[5] = p;
    $[6] = refuted;
    $[7] = verified;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  const tail = t1;
  let t2;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <Text color="background">{DIAMOND_OPEN} </Text>;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  const t3 = running ? phase : 0;
  let t4;
  if ($[10] !== t3 || $[11] !== process.env.CLAUDE_CODE_LANGUAGE) {
    t4 = <RainbowText text={translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.remoteSessionUltrareviewLabel')} phase={t3} />;
    $[10] = t3;
    $[11] = process.env.CLAUDE_CODE_LANGUAGE;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  let t5;
  if ($[13] !== tail) {
    t5 = <Text dimColor={true}> · {tail}</Text>;
    $[13] = tail;
    $[14] = t5;
  } else {
    t5 = $[14];
  }
  let t6;
  if ($[15] !== t4 || $[16] !== t5) {
    t6 = <>{t2}{t4}{t5}</>;
    $[15] = t4;
    $[16] = t5;
    $[17] = t6;
  } else {
    t6 = $[17];
  }
  return t6;
}
export function RemoteSessionProgress(t0) {
  const $ = _c(11);
  const uiLanguage = process.env.CLAUDE_CODE_LANGUAGE;
  const {
    session
  } = t0;
  if (session.isRemoteReview) {
    let t1;
    if ($[0] !== session) {
      t1 = <ReviewRainbowLine session={session} />;
      $[0] = session;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    return t1;
  }
  if (session.status === "completed") {
    let t1;
    if ($[2] !== uiLanguage) {
      t1 = <Text bold={true} color="success" dimColor={true}>{translate(uiLanguage, 'dialogs.backgroundTasksStatusDone')}</Text>;
      $[2] = uiLanguage;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    return t1;
  }
  if (session.status === "failed") {
    let t1;
    if ($[4] !== uiLanguage) {
      t1 = <Text bold={true} color="error" dimColor={true}>{translate(uiLanguage, 'dialogs.backgroundTasksStatusError')}</Text>;
      $[4] = uiLanguage;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    return t1;
  }
  if (!session.todoList.length) {
    let t1;
    if ($[6] !== session.status) {
      t1 = <Text dimColor={true}>{session.status}…</Text>;
      $[6] = session.status;
      $[7] = t1;
    } else {
      t1 = $[7];
    }
    return t1;
  }
  let t1;
  if ($[8] !== session.todoList) {
    t1 = count(session.todoList, _temp);
    $[8] = session.todoList;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  const completed = t1;
  const total = session.todoList.length;
  let t2;
  if ($[10] !== completed || $[11] !== total) {
    t2 = <Text dimColor={true}>{completed}/{total}</Text>;
    $[10] = completed;
    $[11] = total;
    $[12] = t2;
  } else {
    t2 = $[12];
  }
  return t2;
}
function _temp(_) {
  return _.status === "completed";
}
