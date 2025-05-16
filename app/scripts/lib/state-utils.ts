import { cloneDeep } from 'lodash';
import { SnapControllerState } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
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

/**
 * Work around for the fact that are state object is HUGE.
 *
 * https://github.com/MetaMask/metamask-extension/issues/29795#issuecomment-2707612929
 *
 * @param state
 */
export function removeDataFromTransactions(state: FlattenedUIState) {
  if (state.transactions) {
    // state.transactions[i] can't be mutated because its locked down.
    state.transactions = JSON.parse(JSON.stringify(state.transactions));
    for (let i = 0; i < state.transactions.length; i++) {
      // delete the really heavy stuff
      delete state.transactions[i].rawTx;
      delete state.transactions[i].txParams.data;
      state.transactions[i].history.map((his: any) => {
        if (Array.isArray(his)) {
          his.map((h: any) => {
            delete h.rawTx;
            delete h.txParams?.data;
          });
        } else {
          delete his.rawTx;
          delete his.txParams.data;
        }
      });
    }
  }
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
