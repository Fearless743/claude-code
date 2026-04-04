import type { LocalJSXCommandOnDone } from '../../types/command.js';
export async function call(onDone: LocalJSXCommandOnDone): Promise<null> {
  setTimeout(onDone, 0, 'The Claude account upgrade flow has been removed from this build.');
  return null;
}
