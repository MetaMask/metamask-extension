import { SnapControllerState } from '@metamask/snaps-controllers';
import { isSnapId, Snap } from '@metamask/snaps-utils';
import { MemStoreControllersComposedState } from '../../../shared/types/metamask-controller-stores';

const REMOVE_KEYS = ['snapStates', 'unencryptedSnapStates', 'vault'] as const;

export function sanitizeUIState(
  state: MemStoreControllersComposedState,
): MemStoreControllersComposedState {
  const newState = { ...state };

  for (const key of REMOVE_KEYS) {
    if (key === 'vault') {
      delete newState.KeyringController[key];
    } else {
      delete newState.SnapController[key];
    }
  }

  sanitizeSnapData(newState);

  return newState;
}

function sanitizeSnapData(state: MemStoreControllersComposedState) {
  const snapsData: SnapControllerState['snaps'] | undefined =
    state.SnapController.snaps;

  if (!snapsData) {
    return;
  }

  state.SnapController.snaps = Object.values(snapsData).reduce<
    SnapControllerState['snaps']
  >((acc, snap) => {
    if (isSnapId(snap.id)) {
      acc[snap.id] = stripLargeSnapData(snap) as Snap;
    }
    return acc;
  }, {} as never);
}

function stripLargeSnapData(snapData: Snap): Partial<Snap> {
  const newData: Partial<Snap> = {
    ...snapData,
  };

  delete newData.sourceCode;
  delete newData.auxiliaryFiles;

  return newData;
}
