import { c as _c } from "react/compiler-runtime";
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import * as React from 'react';
import { Suspense, useState } from 'react';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { useIsInsideModal, useModalOrTerminalSize } from '../../context/modalContext.js';
import { Pane } from '../design-system/Pane.js';
import { Tabs, Tab } from '../design-system/Tabs.js';
import { Status, buildDiagnostics } from './Status.js';
import { Config } from './Config.js';
import { Usage } from './Usage.js';
import { useAppState } from '../../state/AppState.js';
import { translate } from '../../i18n/index.js';
import type { LocalJSXCommandContext, CommandResultDisplay } from '../../commands.js';
type Props = {
  onClose: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
  context: LocalJSXCommandContext;
  defaultTab: 'Status' | 'Config' | 'Usage' | 'Gates';
};
export function Settings(t0) {
  const $ = _c(25);
  const {
    onClose,
    context,
    defaultTab
  } = t0;
  const uiLanguage = useAppState(s => s.settings.language);
  const [selectedTab, setSelectedTab] = useState(defaultTab);
  const [tabsHidden, setTabsHidden] = useState(false);
  const [configOwnsEsc, setConfigOwnsEsc] = useState(false);
  const [gatesOwnsEsc, setGatesOwnsEsc] = useState(false);
  const insideModal = useIsInsideModal();
  const {
    rows
  } = useModalOrTerminalSize(useTerminalSize());
  const contentHeight = insideModal ? rows + 1 : Math.max(15, Math.min(Math.floor(rows * 0.8), 30));
  const [diagnosticsPromise] = useState(_temp2);
  useExitOnCtrlCDWithKeybindings();
  let t1;
  if ($[0] !== onClose || $[1] !== tabsHidden) {
    t1 = () => {
      if (tabsHidden) {
        return;
      }
      onClose(translate(uiLanguage, 'settings.statusDialogDismissed'), {
        display: "system"
      });
    };
    $[0] = onClose;
    $[1] = tabsHidden;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handleEscape = t1;
  const t2 = !tabsHidden && !(selectedTab === "Config" && configOwnsEsc) && !(selectedTab === "Gates" && gatesOwnsEsc);
  let t3;
  if ($[3] !== t2) {
    t3 = {
      context: "Settings",
      isActive: t2
    };
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  useKeybinding("confirm:no", handleEscape, t3);
  let t4;
  if ($[5] !== context || $[6] !== diagnosticsPromise || $[7] !== uiLanguage) {
    t4 = <Tab key="status" id="Status" title={translate(uiLanguage, 'settings.tabStatus')}><Status context={context} diagnosticsPromise={diagnosticsPromise} /></Tab>;
    $[5] = context;
    $[6] = diagnosticsPromise;
    $[7] = uiLanguage;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let t5;
  if ($[9] !== contentHeight || $[10] !== context || $[11] !== onClose || $[12] !== uiLanguage) {
    t5 = <Tab key="config" id="Config" title={translate(uiLanguage, 'settings.tabConfig')}><Suspense fallback={null}><Config context={context} onClose={onClose} setTabsHidden={setTabsHidden} onIsSearchModeChange={setConfigOwnsEsc} contentHeight={contentHeight} /></Suspense></Tab>;
    $[9] = contentHeight;
    $[10] = context;
    $[11] = onClose;
    $[12] = uiLanguage;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  let t6;
  if ($[14] !== uiLanguage) {
    t6 = <Tab key="usage" id="Usage" title={translate(uiLanguage, 'settings.tabUsage')}><Usage /></Tab>;
    $[14] = uiLanguage;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  let t7;
  if ($[16] !== contentHeight) {
    t7 = [];
    $[16] = contentHeight;
    $[17] = t7;
  } else {
    t7 = $[17];
  }
  let t8;
  if ($[18] !== t4 || $[19] !== t5 || $[20] !== t6 || $[21] !== t7) {
    t8 = [t4, t5, t6, ...t7];
    $[18] = t4;
    $[19] = t5;
    $[20] = t6;
    $[21] = t7;
    $[22] = t8;
  } else {
    t8 = $[22];
  }
  const tabs = t8;
  const t9 = defaultTab !== "Config" && defaultTab !== "Gates";
  const t10 = tabsHidden || insideModal ? undefined : contentHeight;
  let t11;
  if ($[23] !== selectedTab || $[24] !== t10 || $[25] !== t9 || $[26] !== tabs || $[27] !== tabsHidden) {
    t11 = <Pane color="permission"><Tabs color="permission" selectedTab={selectedTab} onTabChange={setSelectedTab} hidden={tabsHidden} initialHeaderFocused={t9} contentHeight={t10}>{tabs}</Tabs></Pane>;
    $[23] = selectedTab;
    $[24] = t10;
    $[25] = t9;
    $[26] = tabs;
    $[27] = tabsHidden;
    $[28] = t11;
  } else {
    t11 = $[28];
  }
  return t11;
}
function _temp2() {
  return buildDiagnostics().catch(_temp);
}
function _temp() {
  return [];
}
