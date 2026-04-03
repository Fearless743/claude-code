import { c as _c } from "react/compiler-runtime";
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import { feature } from 'bun:bundle';
/* eslint-disable @typescript-eslint/no-require-imports */
const coordinatorModule = feature('COORDINATOR_MODE') ? require('../../coordinator/coordinatorMode.js') as typeof import('../../coordinator/coordinatorMode.js') : undefined;
/* eslint-enable @typescript-eslint/no-require-imports */
import { Box, Text, Link } from '../../ink.js';
import * as React from 'react';
import figures from 'figures';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { VimMode, PromptInputMode } from '../../types/textInputTypes.js';
import type { ToolPermissionContext } from '../../Tool.js';
import { isVimModeEnabled } from './utils.js';
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
import { isDefaultMode, getModeColor } from '../../utils/permissions/PermissionMode.js';
import { BackgroundTaskStatus } from '../tasks/BackgroundTaskStatus.js';
import { isBackgroundTask } from '../../tasks/types.js';
import { isPanelAgentTask } from '../../tasks/LocalAgentTask/LocalAgentTask.js';
import { getVisibleAgentTasks } from '../CoordinatorAgentStatus.js';
import { count } from '../../utils/array.js';
import { shouldHideTasksFooter } from '../tasks/taskStatusUtils.js';
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js';
import { TeamStatus } from '../teams/TeamStatus.js';
import { isInProcessEnabled } from '../../utils/swarm/backends/registry.js';
import { useAppState, useAppStateStore } from 'src/state/AppState.js';
import { getIsRemoteMode } from '../../bootstrap/state.js';
import HistorySearchInput from './HistorySearchInput.js';
import { usePrStatus } from '../../hooks/usePrStatus.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { Byline } from '../design-system/Byline.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { useTasksV2 } from '../../hooks/useTasksV2.js';
import { formatDuration } from '../../utils/format.js';
import { translate } from '../../i18n/index.js';
import { VoiceWarmupHint } from './VoiceIndicator.js';
import { useVoiceEnabled } from '../../hooks/useVoiceEnabled.js';
import { useVoiceState } from '../../context/voice.js';
import { isFullscreenEnvEnabled } from '../../utils/fullscreen.js';
import { isXtermJs } from '../../ink/terminal.js';
import { useHasSelection, useSelection } from '../../ink/hooks/use-selection.js';
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
import { getPlatform } from '../../utils/platform.js';
import { PrBadge } from '../PrBadge.js';

/* eslint-disable @typescript-eslint/no-require-imports */
const proactiveModule = feature('PROACTIVE') || feature('KAIROS') ? require('../../proactive/index.js') : null;
/* eslint-enable @typescript-eslint/no-require-imports */
const NO_OP_SUBSCRIBE = (_cb: () => void) => () => {};
const NULL = () => null;
const MAX_VOICE_HINT_SHOWS = 3;

type Props = {
  exitMessage: {
    show: boolean;
    key?: string;
  };
  vimMode: VimMode | undefined;
  mode: PromptInputMode;
  toolPermissionContext: ToolPermissionContext;
  suppressHint: boolean;
  isLoading: boolean;
  showMemoryTypeSelector?: boolean;
  tasksSelected: boolean;
  teamsSelected: boolean;
  tmuxSelected: boolean;
  teammateFooterIndex?: number;
  isPasting?: boolean;
  isSearching: boolean;
  historyQuery: string;
  setHistoryQuery: (query: string) => void;
  historyFailedMatch: boolean;
  onOpenTasksDialog?: (taskId?: string) => void;
};

function ProactiveCountdown() {
  const nextTickAt = useSyncExternalStore(proactiveModule?.subscribeToProactiveChanges ?? NO_OP_SUBSCRIBE, proactiveModule?.getNextTickAt ?? NULL, NULL);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (nextTickAt === null) {
      setRemainingSeconds(null);
      return;
    }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((nextTickAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [nextTickAt]);

  if (remainingSeconds === null) return null;
  return <Text dimColor>{`waiting ${formatDuration(remainingSeconds * 1000, { mostSignificantOnly: true })}`}</Text>;
}

export function PromptInputFooterLeftSide({
  exitMessage,
  vimMode,
  mode,
  toolPermissionContext,
  suppressHint,
  isLoading,
  tasksSelected,
  teamsSelected,
  tmuxSelected,
  teammateFooterIndex,
  isPasting,
  isSearching,
  historyQuery,
  setHistoryQuery,
  historyFailedMatch,
  onOpenTasksDialog,
}: Props) {
  const uiLanguage = useAppState(s => s.settings.language);

  if (exitMessage.show) {
    return (
      <Text dimColor key="exit-message">
        {translate(uiLanguage, 'settings.pressAgainToExit', { key: exitMessage.key ?? '' })}
      </Text>
    );
  }

  if (isPasting) {
    return (
      <Text dimColor key="pasting-message">
        {translate(uiLanguage, 'settings.pastingText')}
      </Text>
    );
  }

  const showVim = isVimModeEnabled() && vimMode === 'INSERT' && !isSearching;
  const historySearch = isSearching ? (
    <HistorySearchInput value={historyQuery} onChange={setHistoryQuery} historyFailedMatch={historyFailedMatch} />
  ) : null;
  const vimHint = showVim ? <Text dimColor key="vim-insert">-- INSERT --</Text> : null;
  const showHint = !suppressHint && !showVim;

  return (
    <Box justifyContent="flex-start" gap={1}>
      {historySearch}
      {vimHint}
      <ModeIndicator
        mode={mode}
        toolPermissionContext={toolPermissionContext}
        showHint={showHint}
        isLoading={isLoading}
        tasksSelected={tasksSelected}
        teamsSelected={teamsSelected}
        teammateFooterIndex={teammateFooterIndex}
        tmuxSelected={tmuxSelected}
        onOpenTasksDialog={onOpenTasksDialog}
      />
    </Box>
  );
}

type ModeIndicatorProps = {
  mode: PromptInputMode;
  toolPermissionContext: ToolPermissionContext;
  showHint: boolean;
  isLoading: boolean;
  tasksSelected: boolean;
  teamsSelected: boolean;
  tmuxSelected: boolean;
  teammateFooterIndex?: number;
  onOpenTasksDialog?: (taskId?: string) => void;
};

function ModeIndicator({
  mode,
  toolPermissionContext,
  showHint,
  isLoading,
  tasksSelected,
  teamsSelected,
  tmuxSelected,
  teammateFooterIndex,
  onOpenTasksDialog,
}: ModeIndicatorProps): React.ReactNode {
  const { columns } = useTerminalSize();
  const uiLanguage = useAppState(s => s.settings.language);
  const modeCycleShortcut = useShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab');
  const tasks = useAppState(s => s.tasks);
  const teamContext = useAppState(s => s.teamContext);
  const store = useAppStateStore();
  const [remoteSessionUrl] = useState(() => store.getState().remoteSessionUrl);
  const viewSelectionMode = useAppState(s => s.viewSelectionMode);
  const viewingAgentTaskId = useAppState(s => s.viewingAgentTaskId);
  const expandedView = useAppState(s => s.expandedView);
  const showSpinnerTree = expandedView === 'teammates';
  const prStatus = usePrStatus(isLoading, isPrStatusEnabled());
  const hasTmuxSession = useAppState(s => ("external" as string) === 'ant' && s.tungstenActiveSession !== undefined);
  const nextTickAt = useSyncExternalStore(proactiveModule?.subscribeToProactiveChanges ?? NO_OP_SUBSCRIBE, proactiveModule?.getNextTickAt ?? NULL, NULL);
  const voiceEnabled = feature('VOICE_MODE') ? useVoiceEnabled() : false;
  const voiceState = feature('VOICE_MODE') ? useVoiceState(s => s.voiceState) : 'idle' as const;
  const voiceWarmingUp = feature('VOICE_MODE') ? useVoiceState(s => s.voiceWarmingUp) : false;
  const hasSelection = useHasSelection();
  const selGetState = useSelection().getState;
  const hasNextTick = nextTickAt !== null;
  const isCoordinator = feature('COORDINATOR_MODE') ? coordinatorModule?.isCoordinatorMode() === true : false;
  const runningTaskCount = useMemo(() => count(Object.values(tasks), t => isBackgroundTask(t) && !(("external" as string) === 'ant' && isPanelAgentTask(t))), [tasks]);
  const tasksV2 = useTasksV2();
  const hasTaskItems = tasksV2 !== undefined && tasksV2.length > 0;
  const escShortcut = useShortcutDisplay('chat:cancel', 'Chat', 'esc').toLowerCase();
  const todosShortcut = useShortcutDisplay('app:toggleTodos', 'Global', 'ctrl+t');
  const killAgentsShortcut = useShortcutDisplay('chat:killAgents', 'Chat', 'ctrl+x ctrl+k');
  const voiceKeyShortcut = feature('VOICE_MODE') ? useShortcutDisplay('voice:pushToTalk', 'Chat', 'Space') : '';
  const [voiceHintUnderCap] = feature('VOICE_MODE') ? useState(() => (getGlobalConfig().voiceFooterHintSeenCount ?? 0) < MAX_VOICE_HINT_SHOWS) : [false];
  const voiceHintIncrementedRef = feature('VOICE_MODE') ? useRef(false) : null;

  useEffect(() => {
    if (!feature('VOICE_MODE')) return;
    if (!voiceEnabled || !voiceHintUnderCap) return;
    if (voiceHintIncrementedRef?.current) return;
    if (voiceHintIncrementedRef) voiceHintIncrementedRef.current = true;
    const newCount = (getGlobalConfig().voiceFooterHintSeenCount ?? 0) + 1;
    saveGlobalConfig(prev => {
      if ((prev.voiceFooterHintSeenCount ?? 0) >= newCount) return prev;
      return { ...prev, voiceFooterHintSeenCount: newCount };
    });
  }, [voiceEnabled, voiceHintUnderCap]);

  const isKillAgentsConfirmShowing = useAppState(s => s.notifications.current?.key === 'kill-agents-confirm');
  const hasTeams = isAgentSwarmsEnabled() && !isInProcessEnabled() && teamContext !== undefined && count(Object.values(teamContext.teammates), t => t.name !== 'team-lead') > 0;

  if (mode === 'bash') {
    return <Text color="bashBorder">{translate(uiLanguage, 'settings.bashModeHint')}</Text>;
  }

  const currentMode = toolPermissionContext?.mode;
  const hasActiveMode = !isDefaultMode(currentMode);
  const viewedTask = viewingAgentTaskId ? tasks[viewingAgentTaskId] : undefined;
  const isViewingTeammate = viewSelectionMode === 'viewing-agent' && viewedTask?.type === 'in_process_teammate';
  const isViewingCompletedTeammate = isViewingTeammate && viewedTask != null && viewedTask.status !== 'running';
  const hasBackgroundTasks = runningTaskCount > 0 || isViewingTeammate;
  const primaryItemCount = (isCoordinator || hasActiveMode ? 1 : 0) + (hasBackgroundTasks ? 1 : 0) + (hasTeams ? 1 : 0);
  const shouldShowPrStatus = isPrStatusEnabled() && prStatus.number !== null && prStatus.reviewState !== null && prStatus.url !== null && primaryItemCount < 2 && (primaryItemCount === 0 || columns >= 80);
  const shouldShowModeHint = primaryItemCount < 2;
  const hasInProcessTeammates = !showSpinnerTree && hasBackgroundTasks && Object.values(tasks).some(t => t.type === 'in_process_teammate');
  const hasTeammatePills = hasInProcessTeammates || (!showSpinnerTree && isViewingTeammate);

  const modeLabelKey = currentMode === 'bypassPermissions'
    ? 'settings.bypassPermissionsMode'
    : currentMode === 'acceptEdits'
      ? 'settings.acceptEditsMode'
      : currentMode === 'auto'
        ? 'settings.autoMode'
        : currentMode === 'plan'
          ? 'settings.planMode'
          : currentMode === 'dontAsk'
            ? 'settings.dontAskMode'
            : 'settings.defaultMode';

  const modeStatusKey = currentMode === 'bypassPermissions'
    ? 'settings.bypassPermissionsOn'
    : currentMode === 'acceptEdits'
      ? 'settings.acceptEditsOn'
      : currentMode === 'auto'
        ? 'settings.autoModeOn'
        : currentMode === 'plan'
          ? 'settings.planModeOn'
          : currentMode === 'dontAsk'
            ? 'settings.dontAskOn'
            : 'settings.defaultModeOn';

  const modePart = currentMode && hasActiveMode && !getIsRemoteMode() ? (
    <Text color={getModeColor(currentMode)} key="mode">
      {translate(uiLanguage, modeStatusKey, {
        mode: `${currentMode === 'bypassPermissions' || currentMode === 'acceptEdits' || currentMode === 'auto' || currentMode === 'plan' || currentMode === 'dontAsk' ? '⏵⏵ ' : ''}${translate(uiLanguage, modeLabelKey)}`,
      })}
      {shouldShowModeHint && (
        <Text dimColor>
          {' '}
          {translate(uiLanguage, 'settings.modeCycleHint', { shortcut: modeCycleShortcut })}
        </Text>
      )}
    </Text>
  ) : null;

  const parts: React.ReactNode[] = [
    ...(remoteSessionUrl ? [
      <Link url={remoteSessionUrl} key="remote">
        <Text color="ide">{figures.circleDouble} remote</Text>
      </Link>,
    ] : []),
    ...(("external" as string) === 'ant' && hasTmuxSession ? [<TungstenPill key="tmux" selected={tmuxSelected} />] : []),
    ...(isAgentSwarmsEnabled() && hasTeams ? [<TeamStatus key="teams" teamsSelected={teamsSelected} showHint={showHint && !hasBackgroundTasks} />] : []),
    ...(shouldShowPrStatus ? [<PrBadge key="pr-status" number={prStatus.number!} url={prStatus.url!} reviewState={prStatus.reviewState!} />] : []),
  ];

  const hasAnyInProcessTeammates = Object.values(tasks).some(t => t.type === 'in_process_teammate' && t.status === 'running');
  const hasRunningAgentTasks = Object.values(tasks).some(t => t.type === 'local_agent' && t.status === 'running');
  const hintParts = showHint ? getSpinnerHintParts(uiLanguage, isLoading, escShortcut, todosShortcut, killAgentsShortcut, hasTaskItems, expandedView, hasAnyInProcessTeammates, hasRunningAgentTasks, isKillAgentsConfirmShowing) : [];

  if (isViewingCompletedTeammate) {
    parts.push(
      <Text dimColor key="esc-return">
        <KeyboardShortcutHint shortcut={escShortcut} action={translate(uiLanguage, 'settings.returnToTeamLeadAction')} />
      </Text>,
    );
  } else if ((feature('PROACTIVE') || feature('KAIROS')) && hasNextTick) {
    parts.push(<ProactiveCountdown key="proactive" />);
  } else if (!hasTeammatePills && showHint) {
    parts.push(...hintParts);
  }

  if (hasTeammatePills) {
    const otherParts = [...(modePart ? [modePart] : []), ...parts, ...(isViewingCompletedTeammate ? [] : hintParts)];
    return (
      <Box flexDirection="column">
        <Box>
          <BackgroundTaskStatus
            tasksSelected={tasksSelected}
            isViewingTeammate={isViewingTeammate}
            teammateFooterIndex={teammateFooterIndex}
            isLeaderIdle={!isLoading}
            onOpenDialog={onOpenTasksDialog}
          />
        </Box>
        {otherParts.length > 0 && (
          <Box>
            <Byline>{otherParts}</Byline>
          </Box>
        )}
      </Box>
    );
  }

  const hasCoordinatorTasks = ("external" as string) === 'ant' && getVisibleAgentTasks(tasks).length > 0;
  const tasksPart = hasBackgroundTasks && !hasTeammatePills && !shouldHideTasksFooter(tasks, showSpinnerTree)
    ? <BackgroundTaskStatus tasksSelected={tasksSelected} isViewingTeammate={isViewingTeammate} teammateFooterIndex={teammateFooterIndex} isLeaderIdle={!isLoading} onOpenDialog={onOpenTasksDialog} />
    : null;

  if (parts.length === 0 && !tasksPart && !modePart && showHint) {
    parts.push(<Text dimColor key="shortcuts-hint">{translate(uiLanguage, 'settings.shortcutsHint')}</Text>);
  }

  const copyOnSelect = getGlobalConfig().copyOnSelect ?? true;
  const selectionHintHasContent = hasSelection && (!copyOnSelect || isXtermJs());

  if (feature('VOICE_MODE') && voiceEnabled && voiceWarmingUp) {
    parts.push(<VoiceWarmupHint key="voice-warmup" />);
  } else if (isFullscreenEnvEnabled() && selectionHintHasContent) {
    const isMac = getPlatform() === 'macos';
    const altClickFailed = isMac && (selGetState()?.lastPressHadAlt ?? false);
    parts.push(
      <Text dimColor key="selection-copy">
        <Byline>
          {!copyOnSelect && <KeyboardShortcutHint shortcut="ctrl+c" action={translate(uiLanguage, 'settings.copyAction')} />}
          {isXtermJs() && (
            altClickFailed
              ? <Text>{translate(uiLanguage, 'settings.macOptionClickSettingHint')}</Text>
              : <KeyboardShortcutHint shortcut={isMac ? 'option+click' : 'shift+click'} action={translate(uiLanguage, 'settings.nativeSelectAction')} />
          )}
        </Byline>
      </Text>,
    );
  } else if (feature('VOICE_MODE') && parts.length > 0 && showHint && voiceEnabled && voiceState === 'idle' && hintParts.length === 0 && voiceHintUnderCap) {
    parts.push(
      <Text dimColor key="voice-hint">
        {translate(uiLanguage, 'settings.holdToSpeakHint', { shortcut: voiceKeyShortcut })}
      </Text>,
    );
  }

  if ((tasksPart || hasCoordinatorTasks) && showHint && !hasTeams) {
    parts.push(
      <Text dimColor key="manage-tasks">
        {tasksSelected
          ? <KeyboardShortcutHint shortcut="Enter" action={translate(uiLanguage, 'settings.viewTasksAction')} />
          : <KeyboardShortcutHint shortcut="↓" action={translate(uiLanguage, 'settings.manageAction')} />}
      </Text>,
    );
  }

  if (parts.length === 0 && !tasksPart && !modePart) {
    return isFullscreenEnvEnabled() ? <Text> </Text> : null;
  }

  return (
    <Box height={1} overflow="hidden">
      {modePart && (
        <Box flexShrink={0}>
          {modePart}
          {(tasksPart || parts.length > 0) && <Text dimColor> · </Text>}
        </Box>
      )}
      {tasksPart && (
        <Box flexShrink={0}>
          {tasksPart}
          {parts.length > 0 && <Text dimColor> · </Text>}
        </Box>
      )}
      {parts.length > 0 && (
        <Text wrap="truncate">
          <Byline>{parts}</Byline>
        </Text>
      )}
    </Box>
  );
}

function getSpinnerHintParts(
  uiLanguage: string | undefined,
  isLoading: boolean,
  escShortcut: string,
  todosShortcut: string,
  killAgentsShortcut: string,
  hasTaskItems: boolean,
  expandedView: 'none' | 'tasks' | 'teammates',
  hasTeammates: boolean,
  hasRunningAgentTasks: boolean,
  isKillAgentsConfirmShowing: boolean,
): React.ReactElement[] {
  let toggleAction: string;
  if (hasTeammates) {
    switch (expandedView) {
      case 'none':
        toggleAction = translate(uiLanguage, 'settings.showTasksAction');
        break;
      case 'tasks':
        toggleAction = translate(uiLanguage, 'settings.showTeammatesAction');
        break;
      case 'teammates':
        toggleAction = translate(uiLanguage, 'settings.hideAction');
        break;
    }
  } else {
    toggleAction = expandedView === 'tasks'
      ? translate(uiLanguage, 'settings.hideAction')
      : translate(uiLanguage, 'settings.showTasksAction');
  }

  const showToggleHint = hasTaskItems || hasTeammates;
  return [
    ...(isLoading ? [
      <Text dimColor key="esc">
        <KeyboardShortcutHint shortcut={escShortcut} action={translate(uiLanguage, 'settings.interruptAction')} />
      </Text>,
    ] : []),
    ...(!isLoading && hasRunningAgentTasks && !isKillAgentsConfirmShowing ? [
      <Text dimColor key="kill-agents">
        <KeyboardShortcutHint shortcut={killAgentsShortcut} action={translate(uiLanguage, 'settings.stopAgentsAction')} />
      </Text>,
    ] : []),
    ...(showToggleHint ? [
      <Text dimColor key="toggle-tasks">
        <KeyboardShortcutHint shortcut={todosShortcut} action={toggleAction} />
      </Text>,
    ] : []),
  ];
}

function isPrStatusEnabled(): boolean {
  return getGlobalConfig().prStatusFooterEnabled ?? true;
}

function TungstenPill({ selected }: { selected: boolean }) {
  return <Text inverse={selected}>tmux</Text>;
}
