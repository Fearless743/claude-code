import React, { useCallback, useEffect, useState } from 'react';
import { checkIsGitClean, checkNeedsClaudeAiLogin } from 'src/utils/background/remote/preconditions.js';
import { gracefulShutdownSync } from 'src/utils/gracefulShutdown.js';
import { Box, Text } from '../ink.js';
import { Dialog } from './design-system/Dialog.js';
import { TeleportStash } from './TeleportStash.js';

export type TeleportLocalErrorType = 'needsLogin' | 'needsGitStash';

type TeleportErrorProps = {
  onComplete: () => void;
  errorsToIgnore?: ReadonlySet<TeleportLocalErrorType>;
};

const EMPTY_ERRORS_TO_IGNORE: ReadonlySet<TeleportLocalErrorType> = new Set();

export function TeleportError({
  onComplete,
  errorsToIgnore = EMPTY_ERRORS_TO_IGNORE,
}: TeleportErrorProps): React.ReactNode {
  const [currentError, setCurrentError] = useState<TeleportLocalErrorType | null>(null);

  const checkErrors = useCallback(async () => {
    const currentErrors = await getTeleportErrors();
    const filteredErrors = new Set(Array.from(currentErrors).filter(error => !errorsToIgnore.has(error)));

    if (filteredErrors.size === 0) {
      onComplete();
      return;
    }

    if (filteredErrors.has('needsLogin')) {
      setCurrentError('needsLogin');
      return;
    }

    if (filteredErrors.has('needsGitStash')) {
      setCurrentError('needsGitStash');
    }
  }, [errorsToIgnore, onComplete]);

  useEffect(() => {
    void checkErrors();
  }, [checkErrors]);

  if (!currentError) {
    return null;
  }

  if (currentError === 'needsGitStash') {
    return (
      <TeleportStash
        onStashAndContinue={() => {
          void checkErrors();
        }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <Dialog title="Claude Login Required" onCancel={onCancel}>
      <Box flexDirection="column">
        <Text dimColor={true}>Teleport requires a Claude.ai account.</Text>
        <Text dimColor={true}>The interactive Claude login flow has been removed from this build.</Text>
        <Text dimColor={true}>This feature remains unavailable until its auth dependency is replaced.</Text>
      </Box>
    </Dialog>
  );
}

function onCancel() {
  gracefulShutdownSync(0);
}

export async function getTeleportErrors(): Promise<Set<TeleportLocalErrorType>> {
  const errors = new Set<TeleportLocalErrorType>();
  const [needsLogin, isGitClean] = await Promise.all([checkNeedsClaudeAiLogin(), checkIsGitClean()]);

  if (needsLogin) {
    errors.add('needsLogin');
  }

  if (!isGitClean) {
    errors.add('needsGitStash');
  }

  return errors;
}
