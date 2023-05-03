import { connect } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  doesAddressRequireLedgerHidConnection,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSubjectMetadata,
  unconfirmedMessagesHashSelector,
  getTotalUnapprovedMessagesCount,
  getCurrentCurrency,
  getPreferences,
  conversionRateSelector,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getAccountType,
  getSelectedAccount,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import {
  isAddressLedger,
  getNativeCurrency,
  getProviderConfig,
} from '../../../ducks/metamask/metamask';
import { getAccountByAddress, valuesFor } from '../../../helpers/utils/util';

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
// eslint-disable-next-line import/order
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import {
  mmiActionsFactory,
  setTypedMsgInProgress,
} from '../../../store/institutional/institution-background';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
///: END:ONLY_INCLUDE_IN

import {
  MESSAGE_TYPE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  ENVIRONMENT_TYPE_NOTIFICATION,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../shared/constants/app';
import {
  cancelMsgs,
  showModal,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  goHome,
  ///: END:ONLY_INCLUDE_IN
} from '../../../store/actions';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import SignatureRequest from './signature-request.component';

function mapStateToProps(state, ownProps) {
  const { txData } = ownProps;

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const envType = getEnvironmentType();
  ///: END:ONLY_INCLUDE_IN

  const {
    msgParams: { from },
  } = txData;
  const providerConfig = getProviderConfig(state);

  const hardwareWalletRequiresConnection =
    doesAddressRequireLedgerHidConnection(state, from);
  const isLedgerWallet = isAddressLedger(state, from);
  const chainId = getCurrentChainId(state);
  const rpcPrefs = getRpcPrefsForCurrentProvider(state);
  const unconfirmedMessagesList = unconfirmedMessagesHashSelector(state);
  const unapprovedMessagesCount = getTotalUnapprovedMessagesCount(state);
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);

  return {
    providerConfig,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    unconfirmedMessagesList,
    unapprovedMessagesCount,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    nativeCurrency: getNativeCurrency(state),
    currentCurrency: getCurrentCurrency(state),
    conversionRate: useNativeCurrencyAsPrimaryCurrency
      ? null
      : conversionRateSelector(state),
    subjectMetadata: getSubjectMetadata(state),
    // not forwarded to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    accountType: getAccountType(state),
    isNotification: envType === ENVIRONMENT_TYPE_NOTIFICATION,
    selectedAccount: getSelectedAccount(state),
    ///: END:ONLY_INCLUDE_IN
  };
}

let mapDispatchToProps = null;

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
function mmiMapDispatchToProps(dispatch) {
  const mmiActions = mmiActionsFactory();
  return {
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    setMsgInProgress: (msgId) => dispatch(setTypedMsgInProgress(msgId)),
    showCustodianDeepLink: ({
      custodyId,
      fromAddress,
      closeNotification,
      onDeepLinkFetched,
      onDeepLinkShown,
    }) =>
      showCustodianDeepLink({
        dispatch,
        mmiActions,
        txId: undefined,
        fromAddress,
        custodyId,
        isSignature: true,
        closeNotification,
        onDeepLinkFetched,
        onDeepLinkShown,
      }),
    showTransactionsFailedModal: ({
      errorMessage,
      closeNotification,
      operationFailed,
    }) =>
      dispatch(
        showModal({
          name: 'TRANSACTION_FAILED',
          errorMessage,
          closeNotification,
          operationFailed,
        }),
      ),
    setWaitForConfirmDeepLinkDialog: (wait) =>
      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(wait)),
    goHome: () => dispatch(goHome()),
  };
}

mapDispatchToProps = mmiMapDispatchToProps;
///: END:ONLY_INCLUDE_IN

mapDispatchToProps = function (dispatch) {
  return {
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    showRejectTransactionsConfirmationModal: ({
      onSubmit,
      unapprovedTxCount: unapprovedMessagesCount,
    }) => {
      return dispatch(
        showModal({
          name: 'REJECT_TRANSACTIONS',
          onSubmit,
          unapprovedTxCount: unapprovedMessagesCount,
          isRequestType: true,
        }),
      );
    },
    cancelAll: (unconfirmedMessagesList) =>
      dispatch(cancelMsgs(unconfirmedMessagesList)),
  };
};

function mergeProps(stateProps, dispatchProps, ownProps) {
  const {
    allAccounts,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    nativeCurrency,
    currentCurrency,
    conversionRate,
    providerConfig,
    subjectMetadata,
    unconfirmedMessagesList,
    unapprovedMessagesCount,
    mostRecentOverviewPage,
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    accountType,
    isNotification,
    ///: END:ONLY_INCLUDE_IN
  } = stateProps;
  const {
    signPersonalMessage,
    signTypedMessage,
    cancelPersonalMessage,
    cancelTypedMessage,
    signMessage,
    cancelMessage,
    txData,
  } = ownProps;

  const { cancelAll: dispatchCancelAll } = dispatchProps;

  const {
    type,
    msgParams: { from },
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);

  let cancel;
  let sign;

  if (type === MESSAGE_TYPE.PERSONAL_SIGN) {
    cancel = cancelPersonalMessage;
    sign = signPersonalMessage;
  } else if (type === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
    cancel = cancelTypedMessage;
    sign = signTypedMessage;
  } else if (type === MESSAGE_TYPE.ETH_SIGN) {
    cancel = cancelMessage;
    sign = signMessage;
  }

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const signFn = async (...opts) => {
    if (accountType === 'custody') {
      try {
        let msgData = opts;
        let id = opts.custodyId;
        if (!opts.custodyId) {
          msgData = await sign(opts);
          id = msgData.custodyId;
        }
        dispatchProps.showCustodianDeepLink({
          custodyId: id,
          fromAddress: fromAccount.address,
          closeNotification: isNotification,
          onDeepLinkFetched: () => undefined,
          onDeepLinkShown: () => undefined,
        });
        await dispatchProps.setMsgInProgress(msgData.metamaskId);
        await dispatchProps.setWaitForConfirmDeepLinkDialog(true);
        await goHome();
        return msgData;
      } catch (err) {
        await dispatchProps.setWaitForConfirmDeepLinkDialog(true);
        await dispatchProps.showTransactionsFailedModal({
          errorMessage: err.message,
          closeNotification: true,
          operationFailed: true,
        });
        return null;
      }
    }

    return sign(opts);
  };
  ///: END:ONLY_INCLUDE_IN

  return {
    ...ownProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancel,
    ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
    sign,
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    // eslint-disable-next-line no-dupe-keys
    sign: signFn,
    ///: END:ONLY_INCLUDE_IN
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    nativeCurrency,
    currentCurrency,
    conversionRate,
    providerConfig,
    subjectMetadata,
    unapprovedMessagesCount,
    mostRecentOverviewPage,
    cancelAll: () => dispatchCancelAll(valuesFor(unconfirmedMessagesList)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SignatureRequest);
