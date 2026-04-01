import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { translate } from '../i18n/index.js';
export function PressEnterToContinue() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Text color="permission">{translate(process.env.CLAUDE_CODE_LANGUAGE, 'dialogs.pressEnterToContinue', { key: 'Enter' })}</Text>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
