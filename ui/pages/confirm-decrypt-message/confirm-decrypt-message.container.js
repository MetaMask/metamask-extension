import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { cloneDeep } from 'lodash';

import {
  goHome,
  decryptMsg,
  cancelDecryptMsg,
  decryptMsgInline,
} from '../../store/actions';
import {
  conversionRateSelector,
  getCurrentCurrency,
  getPreferences,
  getTargetAccountWithSendEtherInfo,
  unconfirmedTransactionsListSelector,
} from '../../selectors';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getNativeCurrency } from '../../ducks/metamask/metamask';
import ConfirmDecryptMessage from './confirm-decrypt-message.component';

function mapStateToProps(state) {
  const {
    metamask: { subjectMetadata = {} },
  } = state;

  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);

  const txData = cloneDeep(unconfirmedTransactions[0]);

  const fromAccount = getTargetAccountWithSendEtherInfo(
    state,
    txData?.msgParams?.from,
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
    decryptMessage: (msgData, event) => {
      const params = msgData.msgParams;
      params.metamaskId = msgData.id;
      event.stopPropagation(event);
      return dispatch(decryptMsg(params));
    },
    cancelDecryptMessage: (msgData, event) => {
      event.stopPropagation(event);
      return dispatch(cancelDecryptMsg(msgData));
    },
    decryptMessageInline: (msgData, event) => {
      const params = msgData.msgParams;
      params.metamaskId = msgData.id;
      event.stopPropagation(event);
      return dispatch(decryptMsgInline(params));
    },
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmDecryptMessage);
