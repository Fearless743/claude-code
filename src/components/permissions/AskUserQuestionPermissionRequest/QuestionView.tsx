import React, { useCallback, useMemo, useState } from 'react';
import type { KeyboardEvent } from '../../../ink/events/keyboard-event.js';
import { Box, Text } from '../../../ink.js';
import { translate } from '../../../i18n/index.js';
import { useAppState } from '../../../state/AppState.js';
import type { Question, QuestionOption } from '../../../tools/AskUserQuestionTool/AskUserQuestionTool.js';
import type { PastedContent } from '../../../utils/config.js';
import { getExternalEditor } from '../../../utils/editor.js';
import { toIDEDisplayName } from '../../../utils/ide.js';
import type { ImageDimensions } from '../../../utils/imageResizer.js';
import { editPromptInEditor } from '../../../utils/promptEditor.js';
import { type OptionWithDescription, Select, SelectMulti } from '../../CustomSelect/index.js';
import { Divider } from '../../design-system/Divider.js';
import { FilePathLink } from '../../FilePathLink.js';
import { PermissionRequestTitle } from '../PermissionRequestTitle.js';
import { PreviewQuestionView } from './PreviewQuestionView.js';
import { QuestionNavigationBar } from './QuestionNavigationBar.js';
import type { QuestionState } from './use-multiple-choice-state.js';
import figures from 'figures';

type Props = {
  question: Question;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  questionStates: Record<string, QuestionState>;
  hideSubmitTab?: boolean;
  planFilePath?: string;
  pastedContents?: Record<number, PastedContent>;
  minContentHeight?: number;
  minContentWidth?: number;
  onUpdateQuestionState: (questionText: string, updates: Partial<QuestionState>, isMultiSelect: boolean) => void;
  onAnswer: (questionText: string, label: string | string[], textInput?: string, shouldAdvance?: boolean) => void;
  onTextInputFocus: (isInInput: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
  onTabPrev?: () => void;
  onTabNext?: () => void;
  onRespondToClaude: () => void;
  onFinishPlanInterview: () => void;
  onImagePaste?: (base64Image: string, mediaType?: string, filename?: string, dimensions?: ImageDimensions, sourcePath?: string) => void;
  onRemoveImage?: (id: number) => void;
};

export function QuestionView(props: Props) {
  const {
    question,
    questions,
    currentQuestionIndex,
    answers,
    questionStates,
    hideSubmitTab: hideSubmitTabProp,
    planFilePath,
    minContentHeight,
    minContentWidth,
    onUpdateQuestionState,
    onAnswer,
    onTextInputFocus,
    onCancel,
    onSubmit,
    onTabPrev,
    onTabNext,
    onRespondToClaude,
    onFinishPlanInterview,
    onImagePaste,
    pastedContents,
    onRemoveImage
  } = props;

  const hideSubmitTab = hideSubmitTabProp ?? false;
  const state = useAppState(state => state);
  const uiLanguage = state.settings.language;
  const isInPlanMode = state.toolPermissionContext.mode === "plan";
  
  const [isFooterFocused, setIsFooterFocused] = useState(false);
  const [footerIndex, setFooterIndex] = useState(0);
  const [isOtherFocused, setIsOtherFocused] = useState(false);

  const editorName = useMemo(() => {
    const editor = getExternalEditor();
    return editor ? toIDEDisplayName(editor) : null;
  }, []);

  const handleFocus = useCallback((value: string) => {
    const isOther = value === "__other__";
    setIsOtherFocused(isOther);
    onTextInputFocus(isOther);
  }, [onTextInputFocus]);

  const handleDownFromLastItem = useCallback(() => {
    setIsFooterFocused(true);
  }, []);

  const handleUpFromFooter = useCallback(() => {
    setIsFooterFocused(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isFooterFocused) {
      return;
    }
    
    if (e.key === "up" || (e.ctrl && e.key === "p")) {
      e.preventDefault();
      if (footerIndex === 0) {
        handleUpFromFooter();
      } else {
        setFooterIndex(0);
      }
      return;
    }
    
    if (e.key === "down" || (e.ctrl && e.key === "n")) {
      e.preventDefault();
      if (isInPlanMode && footerIndex === 0) {
        setFooterIndex(1);
      }
      return;
    }
    
    if (e.key === "return") {
      e.preventDefault();
      if (footerIndex === 0) {
        onRespondToClaude();
      } else {
        onFinishPlanInterview();
      }
      return;
    }
    
    if (e.key === "escape") {
      e.preventDefault();
      onCancel();
    }
  }, [isFooterFocused, footerIndex, isInPlanMode, handleUpFromFooter, onRespondToClaude, onFinishPlanInterview, onCancel]);

  const questionText = question.question;
  const questionState = questionStates[questionText];
  
  const handleOpenEditor = useCallback(async (currentValue: string, setValue: (value: string) => void) => {
    const result = await editPromptInEditor(currentValue);
    if (result.content !== null && result.content !== currentValue) {
      setValue(result.content);
      onUpdateQuestionState(questionText, {
        textInputValue: result.content
      }, question.multiSelect ?? false);
    }
  }, [questionText, question.multiSelect, onUpdateQuestionState]);

  const handleTextInputChange = useCallback((value: string) => {
    onUpdateQuestionState(questionText, {
      textInputValue: value
    }, question.multiSelect ?? false);
  }, [questionText, question.multiSelect, onUpdateQuestionState]);

  const options = useMemo(() => {
    const textOptions = question.options.map<QuestionOption & { type: 'text' }>(opt => ({
      type: 'text',
      value: opt.label,
      label: opt.label,
      description: opt.description
    }));
    
    const otherOption: OptionWithDescription<string> = {
      type: "input" as const,
      value: "__other__",
      label: translate(uiLanguage, 'settings.askUserQuestionOther'),
      placeholder: question.multiSelect
        ? translate(uiLanguage, 'settings.askUserQuestionTypeSomething')
        : translate(uiLanguage, 'settings.askUserQuestionTypeSomethingWithPeriod'),
      initialValue: questionState?.textInputValue ?? "",
      onChange: handleTextInputChange
    };
    
    return [...textOptions, otherOption];
  }, [question.options, question.multiSelect, questionState?.textInputValue, handleTextInputChange]);

  const hasAnyPreview = useMemo(() => {
    return !question.multiSelect && question.options.some(opt => opt.preview);
  }, [question.multiSelect, question.options]);

  if (hasAnyPreview) {
    return (
      <PreviewQuestionView 
        question={question}
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        questionStates={questionStates}
        hideSubmitTab={hideSubmitTab}
        minContentHeight={minContentHeight}
        minContentWidth={minContentWidth}
        onUpdateQuestionState={onUpdateQuestionState}
        onAnswer={onAnswer}
        onTextInputFocus={onTextInputFocus}
        onCancel={onCancel}
        onTabPrev={onTabPrev}
        onTabNext={onTabNext}
        onRespondToClaude={onRespondToClaude}
        onFinishPlanInterview={onFinishPlanInterview}
      />
    );
  }

  const planIndicator = isInPlanMode && planFilePath && (
    <Box flexDirection="column" gap={0}>
      <Divider color="inactive" />
      <Text color="inactive">{translate(uiLanguage, 'settings.askUserQuestionPlanningLabel')}<FilePathLink filePath={planFilePath} /></Text>
    </Box>
  );

  const divider = <Box marginTop={-1}><Divider color="inactive" /></Box>;
  
  const navigationBar = (
    <QuestionNavigationBar 
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      answers={answers}
      hideSubmitTab={hideSubmitTab}
    />
  );

  const title = <PermissionRequestTitle title={question.question} color="text" />;

  const handleMultiSelectChange = useCallback((values: string[]) => {
    onUpdateQuestionState(questionText, {
      selectedValue: values
    }, true);
    
    const textInput = values.includes("__other__") ? questionStates[questionText]?.textInputValue : undefined;
    const finalValues = values.filter(v => v !== "__other__").concat(textInput ? [textInput] : []);
    onAnswer(questionText, finalValues, undefined, false);
  }, [questionText, questionStates, onUpdateQuestionState, onAnswer]);

  const handleSelectChange = useCallback((value: string) => {
    onUpdateQuestionState(questionText, {
      selectedValue: value
    }, false);
    
    const textInput = value === "__other__" ? questionStates[questionText]?.textInputValue : undefined;
    onAnswer(questionText, value, textInput);
  }, [questionText, questionStates, onUpdateQuestionState, onAnswer]);

  const selectComponent = (
    <Box marginTop={1}>
      {question.multiSelect ? (
        <SelectMulti 
          key={question.question}
          options={options}
          defaultValue={questionStates[question.question]?.selectedValue as string[] | undefined}
          onChange={handleMultiSelectChange}
          onFocus={handleFocus}
          onCancel={onCancel}
          submitButtonText={currentQuestionIndex === questions.length - 1 ? translate(uiLanguage, 'settings.askUserQuestionSubmit') : translate(uiLanguage, 'settings.askUserQuestionNext')}
          onSubmit={onSubmit}
          onDownFromLastItem={handleDownFromLastItem}
          isDisabled={isFooterFocused}
          onOpenEditor={handleOpenEditor}
          onImagePaste={onImagePaste}
          pastedContents={pastedContents}
          onRemoveImage={onRemoveImage}
        />
      ) : (
        <Select 
          key={question.question}
          options={options}
          defaultValue={questionStates[question.question]?.selectedValue as string | undefined}
          onChange={handleSelectChange}
          onFocus={handleFocus}
          onCancel={onCancel}
          onDownFromLastItem={handleDownFromLastItem}
          isDisabled={isFooterFocused}
          layout="compact-vertical"
          onOpenEditor={handleOpenEditor}
          onImagePaste={onImagePaste}
          pastedContents={pastedContents}
          onRemoveImage={onRemoveImage}
        />
      )}
    </Box>
  );

  const footerDivider = <Divider color="inactive" />;
  
  const chatAboutThisOption = (
    <Box flexDirection="row" gap={1}>
      {isFooterFocused && footerIndex === 0 ? <Text color="suggestion">{figures.pointer}</Text> : <Text> </Text>}
      <Text color={isFooterFocused && footerIndex === 0 ? "suggestion" : undefined}>
        {options.length + 1}. {translate(uiLanguage, 'settings.askUserQuestionChatAboutThis')}
      </Text>
    </Box>
  );

  const skipInterviewOption = isInPlanMode && (
    <Box flexDirection="row" gap={1}>
      {isFooterFocused && footerIndex === 1 ? <Text color="suggestion">{figures.pointer}</Text> : <Text> </Text>}
      <Text color={isFooterFocused && footerIndex === 1 ? "suggestion" : undefined}>
        {options.length + 2}. {translate(uiLanguage, 'settings.askUserQuestionSkipInterview')}
      </Text>
    </Box>
  );

  const footerOptions = (
    <Box flexDirection="column">
      {footerDivider}
      {chatAboutThisOption}
      {skipInterviewOption}
    </Box>
  );

  const navigationHint = questions.length === 1 ? (
    <>{translate(uiLanguage, 'settings.askUserQuestionArrowNavigate', { up: figures.arrowUp, down: figures.arrowDown })}</>
  ) : (
    translate(uiLanguage, 'settings.askUserQuestionTabArrowNavigate')
  );

  const editorHint = isOtherFocused && editorName
    ? ` · ${translate(uiLanguage, 'settings.askUserQuestionEditInEditor', { editor: editorName })}`
    : '';

  const hintText = (
    <Box marginTop={1}>
      <Text color="inactive" dimColor={true}>
        {translate(uiLanguage, 'settings.askUserQuestionHint', {
          navigationHint: typeof navigationHint === 'string' ? navigationHint : `${figures.arrowUp}/${figures.arrowDown} ${translate(uiLanguage, 'settings.cycleAction')}`,
          editorHint,
        })}
      </Text>
    </Box>
  );

  const content = (
    <Box flexDirection="column" minHeight={minContentHeight}>
      {selectComponent}
      {footerOptions}
      {hintText}
    </Box>
  );

  return (
    <Box flexDirection="column" marginTop={0} tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>
      {planIndicator}
      {divider}
      {navigationBar}
      {title}
      {content}
    </Box>
  );
}
