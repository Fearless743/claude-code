import { feature } from 'bun:bundle';
import { Box, Text } from 'src/ink.js';
import { translate } from '../../i18n/index.js';
import { useAppState } from 'src/state/AppState.js';
import { getPlatform } from 'src/utils/platform.js';
import { isKeybindingCustomizationEnabled } from '../../keybindings/loadUserBindings.js';
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js';
import { isFastModeAvailable, isFastModeEnabled } from '../../utils/fastMode.js';
import { getNewlineInstructions } from './utils.js';

/** Format a shortcut for display in the help menu (e.g., "ctrl+o" → "ctrl + o") */
function formatShortcut(shortcut: string): string {
  return shortcut.replace(/\+/g, ' + ');
}
type Props = {
  dimColor?: boolean;
  fixedWidth?: boolean;
  gap?: number;
  paddingX?: number;
};
export function PromptInputHelpMenu(props) {
  const {
    dimColor,
    fixedWidth,
    gap,
    paddingX
  } = props;
  const uiLanguage = useAppState(s => s.settings.language);
  const transcriptShortcut = formatShortcut(useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o"));
  const todosShortcut = formatShortcut(useShortcutDisplay("app:toggleTodos", "Global", "ctrl+t"));
  const undoShortcut = formatShortcut(useShortcutDisplay("chat:undo", "Chat", "ctrl+_"));
  const stashShortcut = formatShortcut(useShortcutDisplay("chat:stash", "Chat", "ctrl+s"));
  const cycleModeShortcut = formatShortcut(useShortcutDisplay("chat:cycleMode", "Chat", "shift+tab"));
  const modelPickerShortcut = formatShortcut(useShortcutDisplay("chat:modelPicker", "Chat", "alt+p"));
  const fastModeShortcut = formatShortcut(useShortcutDisplay("chat:fastMode", "Chat", "alt+o"));
  const externalEditorShortcut = formatShortcut(useShortcutDisplay("chat:externalEditor", "Chat", "ctrl+g"));
  const terminalShortcut = formatShortcut(useShortcutDisplay("app:toggleTerminal", "Global", "meta+j"));
  const imagePasteShortcut = formatShortcut(useShortcutDisplay("chat:imagePaste", "Chat", "ctrl+v"));

  const terminalShortcutElement = feature("TERMINAL_PANEL") && getFeatureValue_CACHED_MAY_BE_STALE("tengu_terminal_panel", false)
    ? <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.terminalHint', {
      shortcut: terminalShortcut
    })}</Text></Box>
    : null;
  const leftColumnWidth = fixedWidth ? 24 : undefined;
  const bashModeHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.bashModeHint')}</Text></Box>;
  const commandsHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.commandsHint')}</Text></Box>;
  const filePathsHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.filePathsHint')}</Text></Box>;
  const backgroundHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.backgroundHint')}</Text></Box>;
  const sideQuestionHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.sideQuestionHint')}</Text></Box>;
  const leftColumn = <Box flexDirection="column" width={leftColumnWidth}>{bashModeHintElement}{commandsHintElement}{filePathsHintElement}{backgroundHintElement}{sideQuestionHintElement}</Box>;

  const middleColumnWidth = fixedWidth ? 35 : undefined;
  const clearInputHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.clearInputHint')}</Text></Box>;
  const autoAcceptEditsHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, false ? 'settings.cycleModesHint' : 'settings.autoAcceptEditsHint', {
    shortcut: cycleModeShortcut
  })}</Text></Box>;
  const verboseOutputHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.verboseOutputHint', {
    shortcut: transcriptShortcut
  })}</Text></Box>;
  const toggleTasksHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.toggleTasksHint', {
    shortcut: todosShortcut
  })}</Text></Box>;
  const newlineInstructions = getNewlineInstructions();
  const newlineInstructionsElement = <Box><Text dimColor={dimColor}>{newlineInstructions}</Text></Box>;
  const middleColumn = <Box flexDirection="column" width={middleColumnWidth}>{clearInputHintElement}{autoAcceptEditsHintElement}{verboseOutputHintElement}{toggleTasksHintElement}{terminalShortcutElement}{newlineInstructionsElement}</Box>;

  const undoHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.undoHint', {
    shortcut: undoShortcut
  })}</Text></Box>;
  const suspendHintElement = getPlatform() !== "windows"
    ? <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.suspendHint')}</Text></Box>
    : null;
  const pasteImagesHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.pasteImagesHint', {
    shortcut: imagePasteShortcut
  })}</Text></Box>;
  const switchModelHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.switchModelHint', {
    shortcut: modelPickerShortcut
  })}</Text></Box>;
  const toggleFastModeHintElement = isFastModeEnabled() && isFastModeAvailable()
    ? <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.toggleFastModeHint', {
      shortcut: fastModeShortcut
    })}</Text></Box>
    : null;
  const stashPromptHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.stashPromptHint', {
    shortcut: stashShortcut
  })}</Text></Box>;
  const editInEditorHintElement = <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.editInEditorHint', {
    shortcut: externalEditorShortcut,
    editor: '$EDITOR'
  })}</Text></Box>;
  const customizeKeybindingsHintElement = isKeybindingCustomizationEnabled()
    ? <Box><Text dimColor={dimColor}>{translate(uiLanguage, 'settings.customizeKeybindingsHint')}</Text></Box>
    : null;
  const rightColumn = <Box flexDirection="column">{undoHintElement}{suspendHintElement}{pasteImagesHintElement}{switchModelHintElement}{toggleFastModeHintElement}{stashPromptHintElement}{editInEditorHintElement}{customizeKeybindingsHintElement}</Box>;

  return <Box paddingX={paddingX} flexDirection="row" gap={gap}>{leftColumn}{middleColumn}{rightColumn}</Box>;
}
