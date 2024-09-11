import { SnapControllerState } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';

const REMOVE_KEYS = ['snapStates', 'unencryptedSnapStates', 'vault'];

export function sanitizeUIState(
  flattenedState: Record<string, any>,
): Record<string, any> {
  const newState = { ...flattenedState };

  for (const key of REMOVE_KEYS) {
    delete newState[key];
  }

  sanitizeSnapData(newState);

  return newState;
}

function sanitizeSnapData(flattenedState: Record<string, any>) {
  const snapsData = flattenedState.snaps as SnapControllerState['snaps'] | undefined;

  if(!snapsData) {
    return;
  }

  flattenedState.snaps = Object.values(snapsData).reduce((acc, snap) => {
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
