import { connect } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  doesAddressRequireLedgerHidConnection,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  conversionRateSelector,
  getSubjectMetadata,
  unconfirmedMessagesHashSelector,
  getTotalUnapprovedMessagesCount,
  getCurrentCurrency,
  getPreferences,
} from '../../../selectors';
import {
  isAddressLedger,
  getNativeCurrency,
} from '../../../ducks/metamask/metamask';
import { getAccountByAddress, valuesFor } from '../../../helpers/utils/util';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { cancelMsgs, showModal } from '../../../store/actions';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import SignatureRequest from './signature-request.component';

function mapStateToProps(state, ownProps) {
  const { txData } = ownProps;
  const {
    msgParams: { from },
  } = txData;
  const { provider } = state.metamask;

  const hardwareWalletRequiresConnection =
    doesAddressRequireLedgerHidConnection(state, from);
  const isLedgerWallet = isAddressLedger(state, from);
  const chainId = getCurrentChainId(state);
  const rpcPrefs = getRpcPrefsForCurrentProvider(state);
  const unconfirmedMessagesList = unconfirmedMessagesHashSelector(state);
  const unapprovedMessagesCount = getTotalUnapprovedMessagesCount(state);
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);

  return {
    provider,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    unconfirmedMessagesList,
    unapprovedMessagesCount,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    conversionRate: conversionRateSelector(state),
    nativeCurrency: getNativeCurrency(state),
    currentCurrency: getCurrentCurrency(state),
    useNativeCurrencyAsPrimaryCurrency,
    subjectMetadata: getSubjectMetadata(state),
    // not forwarded to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
  };
}

function mapDispatchToProps(dispatch) {
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
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const {
    allAccounts,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    conversionRate,
    nativeCurrency,
    currentCurrency,
    useNativeCurrencyAsPrimaryCurrency,
    provider,
    subjectMetadata,
    unconfirmedMessagesList,
    unapprovedMessagesCount,
    mostRecentOverviewPage,
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

  return {
    ...ownProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancel,
    sign,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    conversionRate,
    nativeCurrency,
    currentCurrency,
    useNativeCurrencyAsPrimaryCurrency,
    provider,
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
