import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { Box, Text } from '../../ink.js';
import { translate } from '../../i18n/index.js';
type Props = {
  instructions?: string;
};
export function AgentNavigationFooter(t0) {
  const $ = _c(2);
  const {
    instructions: t1
  } = t0;
  const instructions = t1 === undefined ? translate(process.env.CLAUDE_CODE_LANGUAGE, 'agents.navInstructions') : t1;
  const exitState = useExitOnCtrlCDWithKeybindings();
  const t2 = exitState.pending ? translate(process.env.CLAUDE_CODE_LANGUAGE, 'agents.navExitInstructions', {
    key: exitState.keyName,
  }) : instructions;
  let t3;
  if ($[0] !== t2) {
    t3 = <Box marginLeft={2}><Text dimColor={true}>{t2}</Text></Box>;
    $[0] = t2;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  return t3;
}
