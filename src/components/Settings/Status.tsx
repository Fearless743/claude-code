import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { Suspense, use } from 'react';
import { getSessionId } from '../../bootstrap/state.js';
import type { LocalJSXCommandContext } from '../../commands.js';
import { useIsInsideModal } from '../../context/modalContext.js';
import { Box, Text, useTheme } from '../../ink.js';
import { type AppState, useAppState } from '../../state/AppState.js';
import { getCwd } from '../../utils/cwd.js';
import { getCurrentSessionTitle } from '../../utils/sessionStorage.js';
import { buildAccountProperties, buildAPIProviderProperties, buildIDEProperties, buildInstallationDiagnostics, buildInstallationHealthDiagnostics, buildMcpProperties, buildMemoryDiagnostics, buildSandboxProperties, buildSettingSourcesProperties, type Diagnostic, getModelDisplayLabel, type Property } from '../../utils/status.js';
import type { ThemeName } from '../../utils/theme.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { translate } from '../../i18n/index.js';
type Props = {
  context: LocalJSXCommandContext;
  diagnosticsPromise: Promise<Diagnostic[]>;
};
function buildPrimarySection(uiLanguage: string | undefined): Property[] {
  const sessionId = getSessionId();
  const customTitle = getCurrentSessionTitle(sessionId);
  const nameValue = customTitle ?? <Text dimColor>{translate(uiLanguage, 'settings.renameToAddName')}</Text>;
  return [{
    label: translate(uiLanguage, 'settings.statusVersionLabel'),
    value: MACRO.VERSION
  }, {
    label: translate(uiLanguage, 'settings.statusSessionNameLabel'),
    value: nameValue
  }, {
    label: translate(uiLanguage, 'settings.statusSessionIdLabel'),
    value: sessionId
  }, {
    label: translate(uiLanguage, 'settings.statusCwdLabel'),
    value: getCwd()
  }, ...buildAccountProperties(), ...buildAPIProviderProperties()];
}
function buildSecondarySection({
  uiLanguage,
  mainLoopModel,
  mcp,
  theme,
  context
}: {
  uiLanguage: string | undefined;
  mainLoopModel: AppState['mainLoopModel'];
  mcp: AppState['mcp'];
  theme: ThemeName;
  context: LocalJSXCommandContext;
}): Property[] {
  const modelLabel = getModelDisplayLabel(mainLoopModel);
  return [{
    label: translate(uiLanguage, 'settings.statusModelLabel'),
    value: modelLabel
  }, ...buildIDEProperties(mcp.clients, context.options.ideInstallationStatus, theme), ...buildMcpProperties(mcp.clients, theme), ...buildSandboxProperties(), ...buildSettingSourcesProperties()];
}
export async function buildDiagnostics(): Promise<Diagnostic[]> {
  return [...(await buildInstallationDiagnostics()), ...(await buildInstallationHealthDiagnostics()), ...(await buildMemoryDiagnostics())];
}
function PropertyValue(t0) {
  const $ = _c(8);
  const {
    value
  } = t0;
  if (Array.isArray(value)) {
    let t1;
    if ($[0] !== value) {
      let t2;
      if ($[2] !== value.length) {
        t2 = (item, i) => <Text key={i}>{item}{i < value.length - 1 ? "," : ""}</Text>;
        $[2] = value.length;
        $[3] = t2;
      } else {
        t2 = $[3];
      }
      t1 = value.map(t2);
      $[0] = value;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    let t2;
    if ($[4] !== t1) {
      t2 = <Box flexWrap="wrap" columnGap={1} flexShrink={99}>{t1}</Box>;
      $[4] = t1;
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    return t2;
  }
  if (typeof value === "string") {
    let t1;
    if ($[6] !== value) {
      t1 = <Text>{value}</Text>;
      $[6] = value;
      $[7] = t1;
    } else {
      t1 = $[7];
    }
    return t1;
  }
  return value;
}
export function Status(t0) {
  const $ = _c(20);
  const {
    context,
    diagnosticsPromise
  } = t0;
  const uiLanguage = useAppState(s => s.settings.language);
  const mainLoopModel = useAppState(_temp);
  const mcp = useAppState(_temp2);
  const [theme] = useTheme();
  let t1;
  if ($[0] !== uiLanguage) {
    t1 = buildPrimarySection(uiLanguage);
    $[0] = uiLanguage;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== context || $[3] !== mainLoopModel || $[4] !== mcp || $[5] !== theme || $[6] !== uiLanguage) {
    t2 = buildSecondarySection({
      uiLanguage,
      mainLoopModel,
      mcp,
      theme,
      context
    });
    $[2] = context;
    $[3] = mainLoopModel;
    $[4] = mcp;
    $[5] = theme;
    $[6] = uiLanguage;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  let t3;
  if ($[8] !== t1 || $[9] !== t2) {
    t3 = [t1, t2];
    $[8] = t1;
    $[9] = t2;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  const sections = t3;
  const grow = useIsInsideModal() ? 1 : undefined;
  let t4;
  if ($[11] !== sections) {
    t4 = sections.map(_temp4);
    $[11] = sections;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  let t5;
  if ($[13] !== diagnosticsPromise) {
    t5 = <Suspense fallback={null}><Diagnostics promise={diagnosticsPromise} /></Suspense>;
    $[13] = diagnosticsPromise;
    $[14] = t5;
  } else {
    t5 = $[14];
  }
  let t6;
  if ($[15] !== grow || $[16] !== t4 || $[17] !== t5) {
    t6 = <Box flexDirection="column" gap={1} flexGrow={grow}>{t4}{t5}</Box>;
    $[15] = grow;
    $[16] = t4;
    $[17] = t5;
    $[18] = t6;
  } else {
    t6 = $[18];
  }
  let t7;
  if ($[19] !== uiLanguage) {
    t7 = <Text dimColor={true}><ConfigurableShortcutHint action="confirm:no" context="Settings" fallback="Esc" description={translate(uiLanguage, 'settings.cancelAction')} /></Text>;
    $[19] = uiLanguage;
    $[20] = t7;
  } else {
    t7 = $[20];
  }
  let t8;
  if ($[21] !== grow || $[22] !== t6 || $[23] !== t7) {
    t8 = <Box flexDirection="column" flexGrow={grow}>{t6}{t7}</Box>;
    $[21] = grow;
    $[22] = t6;
    $[23] = t7;
    $[24] = t8;
  } else {
    t8 = $[24];
  }
  return t8;
}
function _temp4(properties, i) {
  return properties.length > 0 && <Box key={i} flexDirection="column">{properties.map(_temp3)}</Box>;
}
function _temp3(t0, j) {
  const {
    label,
    value
  } = t0;
  return <Box key={j} flexDirection="row" gap={1} flexShrink={0}>{label !== undefined && <Text bold={true}>{label}:</Text>}<PropertyValue value={value} /></Box>;
}
function _temp2(s_0) {
  return s_0.mcp;
}
function _temp(s) {
  return s.mainLoopModel;
}
function Diagnostics(t0) {
  const $ = _c(5);
  const uiLanguage = useAppState(s => s.settings.language);
  const {
    promise
  } = t0;
  const diagnostics = use(promise) as any[];
  if (diagnostics.length === 0) {
    return null;
  }
  let t1;
  if ($[0] !== uiLanguage) {
    t1 = <Text bold={true}>{translate(uiLanguage, 'settings.systemDiagnosticsTitle')}</Text>;
    $[0] = uiLanguage;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== diagnostics) {
    t2 = diagnostics.map(_temp5);
    $[2] = diagnostics;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1 || $[5] !== t2) {
    t3 = <Box flexDirection="column" paddingBottom={1}>{t1}{t2}</Box>;
    $[4] = t1;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}
function _temp5(diagnostic, i) {
  return <Box key={i} flexDirection="row" gap={1} paddingX={1}><Text color="error">{figures.warning}</Text>{typeof diagnostic === "string" ? <Text wrap="wrap">{diagnostic}</Text> : diagnostic}</Box>;
}
