import { SnapControllerState } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlattenedUIState = Record<string, any>;

const REMOVE_KEYS = ['snapStates', 'unencryptedSnapStates', 'vault'];

export function sanitizeUIState(state: FlattenedUIState): FlattenedUIState {
  const newState = { ...state };

  for (const key of REMOVE_KEYS) {
    delete newState[key];
  }

  sanitizeSnapData(newState);

  return newState;
}

function sanitizeSnapData(state: FlattenedUIState) {
  const snapsData = state.snaps as SnapControllerState['snaps'] | undefined;

  if (!snapsData) {
    return;
  }

  state.snaps = Object.values(snapsData).reduce((acc, snap) => {
    acc[snap.id] = stripLargeSnapData(snap) as Snap;
    return acc;
  }, {} as SnapControllerState['snaps']);
}

function stripLargeSnapData(snapData: Snap): Partial<Snap> {
  const newData: Partial<Snap> = {
    ...snapData,
  };

  delete newData.sourceCode;
  delete newData.auxiliaryFiles;

  return newData;
}
