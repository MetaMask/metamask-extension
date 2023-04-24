import log from 'loglevel';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import {
  closeCurrentNotificationWindow,
  hideModal,
  showModal,
  showLoadingIndication,
  hideLoadingIndication,
  setUnconnectedAccountAlertShown,
  displayWarning,
  forceUpdateMetamaskState,
  _setSelectedAddress,
} from '../actions';
import {
  CombinedBackgroundAndReduxState,
  MetaMaskReduxState,
  TemporaryMessageDataType,
} from '../store';
import { getUnconnectedAccountAlertEnabledness } from '../../ducks/metamask/metamask';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import {
  getPermittedAccountsForCurrentTab,
  getSelectedAddress,
} from '../../selectors';
import { switchedToUnconnectedAccount } from '../../ducks/alerts/unconnected-account';

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

export function showCustodyConfirmLink(
  link: string,
  address: string,
  closeNotification: boolean,
  custodyId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
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
  if (!newState.currentNetworkTxList || !state.metamask.currentNetworkTxList) {
    return;
  }

  const differentTxs = newState.currentNetworkTxList.filter(
    (item) =>
      state.metamask.currentNetworkTxList.filter(
        (tx: { [key: string]: any }) =>
          tx.custodyId === item.custodyId &&
          tx.custodyStatus !== item.custodyStatus,
      ).length > 0,
  );

  const txStateSaysDeepLinkShouldClose = Boolean(
    differentTxs.find((tx) => {
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

export function checkForUnapprovedTypedMessages(
  msgData: TemporaryMessageDataType['msgParams'],
  newState: MetaMaskReduxState['metamask'],
) {
  const custodianUnapprovedMessages = Object.keys(
    newState.unapprovedTypedMessages,
  )
    .map((key) => newState.unapprovedTypedMessages[key])
    .filter((message) => message.custodyId && message.status === 'unapproved');

  if (custodianUnapprovedMessages && custodianUnapprovedMessages.length > 0) {
    return {
      ...msgData,
      custodyId:
        newState.unapprovedTypedMessages[msgData.metamaskId]?.custodyId,
    };
  }

  return msgData;
}
