import React from 'react';
import type { CommandResultDisplay, LocalJSXCommandContext } from '../../commands.js';
import { Text } from '../../ink.js';
import { Dialog } from '../../components/design-system/Dialog.js';
import { logEvent } from '../../services/analytics/index.js';
import type { ToolUseContext } from '../../Tool.js';
import type { LocalJSXCommandOnDone } from '../../types/command.js';
type RateLimitOptionsMenuProps = {
  onDone: (
    result?: string,
    options?:
      | {
          display?: CommandResultDisplay | undefined;
        }
      | undefined,
  ) => void;
  context: ToolUseContext & LocalJSXCommandContext;
};

function RateLimitOptionsMenu({ onDone }: RateLimitOptionsMenuProps): React.ReactNode {
  function handleCancel() {
    logEvent('tengu_rate_limit_options_menu_cancel', {});
    onDone(undefined, {
      display: 'skip',
    });
  }

  return (
    <Dialog title="Rate Limit Reached" onCancel={handleCancel} color="suggestion">
      <Text dimColor={true}>Additional account-based rate limit actions have been removed from this build.</Text>
    </Dialog>
  );
}
export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
): Promise<React.ReactNode> {
  return <RateLimitOptionsMenu onDone={onDone} context={context} />;
}
