import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  closeCurrentNotificationWindow,
  hideModal,
  showModal,
} from '../actions';
import {
  CombinedBackgroundAndReduxState,
  MetaMaskReduxState,
  TemporaryMessageDataType,
  MessagesIndexedById,
} from '../store';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { getCurrentNetworkTransactions } from '../../selectors';

export function showInteractiveReplacementTokenModal(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch) => {
    dispatch(
      showModal({
        name: 'INTERACTIVE_REPLACEMENT_TOKEN_MODAL',
      }),
    );
  };
}

export function showCustodyConfirmLink({
  link,
  address,
  closeNotification,
  custodyId,
}: {
  link: string;
  address: string;
  closeNotification: boolean;
  custodyId: string;
}): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch) => {
    dispatch(
      showModal({
        name: 'CUSTODY_CONFIRM_LINK',
        link,
        address,
        closeNotification,
        custodyId,
      }),
    );
  };
}

export function updateCustodyState(
  dispatch: ThunkDispatch<CombinedBackgroundAndReduxState, unknown, AnyAction>,
  newState: MetaMaskReduxState['metamask'],
  state: CombinedBackgroundAndReduxState & any,
) {
  if (!newState.transactions || !state.metamask.transactions) {
    return;
  }

  const newCurrentNetworkTxList = getCurrentNetworkTransactions({
    metamask: newState,
  });

  const oldCurrentNetworkTxList = getCurrentNetworkTransactions(state);

  const differentTxs = newCurrentNetworkTxList.filter(
    (item: TransactionMeta) =>
      oldCurrentNetworkTxList.filter(
        (tx: { [key: string]: any }) =>
          tx.custodyId === item.custodyId &&
          tx.custodyStatus !== item.custodyStatus,
      ).length > 0,
  );

  const txStateSaysDeepLinkShouldClose = Boolean(
    differentTxs.find((tx: TransactionMeta) => {
      const custodyAccountDetails =
        state.metamask.custodyAccountDetails[
          toChecksumHexAddress(tx.txParams.from)
        ];
      const custody = custodyAccountDetails?.custodyType
        .split(' - ')[1]
        .toLowerCase();
      if (!custody) {
        return false;
      }

      return (
        tx.custodyId === state.appState.modal.modalState.props?.custodyId &&
        tx.custodyStatus &&
        (state.metamask.custodyStatusMaps[custody][tx.custodyStatus]
          ?.mmStatus !== 'approved' ||
          tx.custodyStatus === 'created')
      );
    }),
  );

  if (
    state.appState.modal.open &&
    state.appState.modal.modalState.name === 'CUSTODY_CONFIRM_LINK' &&
    txStateSaysDeepLinkShouldClose
  ) {
    if (state.appState.modal.modalState.props?.closeNotification) {
      dispatch(closeCurrentNotificationWindow());
    }
    dispatch(hideModal());
  }

  if (
    state.appState.modal.open &&
    state.appState.modal.modalState.name ===
      'INTERACTIVE_REPLACEMENT_TOKEN_MODAL'
  ) {
    if (state.appState.modal.modalState.props?.closeNotification) {
      dispatch(closeCurrentNotificationWindow());
    }
  }
}

export function checkForUnapprovedMessages(
  msgData: TemporaryMessageDataType,
  unapprovedMessages: MessagesIndexedById,
) {
  const custodianUnapprovedMessages = Object.keys(unapprovedMessages)
    .map((key) => unapprovedMessages[key])
    .filter((message) => {
      return message.metadata?.custodyId && message.status === 'unapproved';
    });

  if (custodianUnapprovedMessages && custodianUnapprovedMessages.length > 0) {
    return {
      ...msgData,
      custodyId: unapprovedMessages[msgData.id]?.metadata?.custodyId,
    };
  }

  return msgData;
}
