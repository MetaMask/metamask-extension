import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import {
  goHome,
  encryptionPublicKeyMsg,
  cancelEncryptionPublicKeyMsg,
} from '../../store/actions';

import {
  conversionRateSelector,
  unconfirmedTransactionsListSelector,
  getTargetAccountWithSendEtherInfo,
  getPreferences,
  getCurrentCurrency,
} from '../../selectors';

import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getNativeCurrency } from '../../ducks/metamask/metamask';
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component';

function mapStateToProps(state) {
  const {
    metamask: { subjectMetadata = {} },
  } = state;

  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);

  const txData = unconfirmedTransactions[0];

  const fromAccount = getTargetAccountWithSendEtherInfo(
    state,
    txData?.msgParams,
  );

  return {
    txData,
    subjectMetadata,
    fromAccount,
    requester: null,
    requesterAddress: null,
    conversionRate: useNativeCurrencyAsPrimaryCurrency
      ? null
      : conversionRateSelector(state),
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    nativeCurrency: getNativeCurrency(state),
    currentCurrency: getCurrentCurrency(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    goHome: () => dispatch(goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    encryptionPublicKey: (msgData, event) => {
      const params = { data: msgData.msgParams, metamaskId: msgData.id };
      event.stopPropagation();
      return dispatch(encryptionPublicKeyMsg(params));
    },
    cancelEncryptionPublicKey: (msgData, event) => {
      event.stopPropagation();
      return dispatch(cancelEncryptionPublicKeyMsg(msgData));
    },
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmEncryptionPublicKey);
