import { SnapControllerState } from '@metamask/snaps-controllers';
import { isSnapId, Snap } from '@metamask/snaps-utils';
import { getKnownPropertyNames } from '@metamask/utils';
import { MemStoreControllersComposedState } from '../../../shared/types/metamask';

const REMOVE_PATHS = {
  SnapController: ['snapStates', 'unencryptedSnapStates'],
  KeyringController: ['vault'],
} as const;

export function sanitizeUIState<
  ControllerKey extends keyof MemStoreControllersComposedState = keyof MemStoreControllersComposedState,
>(state: Pick<MemStoreControllersComposedState, ControllerKey>) {
  const newState = { ...state };

  getKnownPropertyNames(REMOVE_PATHS).forEach((controllerName) => {
    if (
      !(controllerName in newState) ||
      !newState[controllerName as keyof typeof newState]
    ) {
      return;
    }
    const [controllerState, keys] = [
      newState[controllerName as keyof typeof newState],
      REMOVE_PATHS[controllerName],
    ];
    keys.forEach((key) => {
      if (key in controllerState) {
        delete controllerState[key as keyof typeof controllerState];
      }
    });
  });

  sanitizeSnapData(newState);

  return newState;
}

function sanitizeSnapData(
  state:
    | Pick<MemStoreControllersComposedState, 'SnapController'>
    | Partial<Omit<MemStoreControllersComposedState, 'SnapController'>>,
) {
  if (!('SnapController' in state) || !state.SnapController?.snaps) {
    return;
  }
  const snapsData = state.SnapController.snaps;
  state.SnapController.snaps = Object.values(snapsData).reduce<
    SnapControllerState['snaps']
  >((acc, snap) => {
    if (isSnapId(snap.id)) {
      acc[snap.id] = stripLargeSnapData(snap) as Snap;
    }
    return acc;
  }, {});
}

function stripLargeSnapData(snapData: Snap): Partial<Snap> {
  const newData: Partial<Snap> = {
    ...snapData,
  };

  delete newData.sourceCode;
  delete newData.auxiliaryFiles;

  return newData;
}
