import { c as _c } from "react/compiler-runtime";
import sample from 'lodash-es/sample.js';
import React from 'react';
import { useAppState } from 'src/state/AppState.js';
import { translate } from 'src/i18n/index.js';
import { gracefulShutdown } from '../utils/gracefulShutdown.js';
import { WorktreeExitDialog } from './WorktreeExitDialog.js';
const GOODBYE_MESSAGE_KEYS = [
  'settings.goodbyeMessage1',
  'settings.goodbyeMessage2',
  'settings.goodbyeMessage3',
  'settings.goodbyeMessage4',
] as const;
function getRandomGoodbyeMessage(uiLanguage: string): string {
  return sample(GOODBYE_MESSAGE_KEYS.map(key => translate(uiLanguage, key))) ?? translate(uiLanguage, 'settings.goodbyeMessage1');
}
type Props = {
  onDone: (message?: string) => void;
  onCancel?: () => void;
  showWorktree: boolean;
};
export function ExitFlow(t0) {
  const $ = _c(7);
  const {
    showWorktree,
    onDone,
    onCancel
  } = t0;
  const uiLanguage = useAppState(s => s.settings.language);
  let t1;
  if ($[0] !== onDone || $[1] !== uiLanguage) {
    t1 = async function onExit(resultMessage) {
      onDone(resultMessage ?? getRandomGoodbyeMessage(uiLanguage));
      await gracefulShutdown(0, "prompt_input_exit");
    };
    $[0] = onDone;
    $[1] = uiLanguage;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const onExit = t1;
  if (showWorktree) {
    let t2;
    if ($[3] !== onCancel || $[4] !== onExit) {
      t2 = <WorktreeExitDialog onDone={onExit} onCancel={onCancel} />;
      $[3] = onCancel;
      $[4] = onExit;
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    return t2;
  }
  return null;
}
