import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  contractExchangeRateSelector,
  transactionFeeSelector,
} from '../../selectors';
import { getTokens } from '../../ducks/metamask/metamask';
import { getTokenData } from '../../helpers/utils/transactions.util';
import {
  calcTokenAmount,
  getTokenAddressParam,
  getTokenValueParam,
} from '../../helpers/utils/token-util';
import { hexWEIToDecETH } from '../../helpers/utils/conversions.util';
import { getHexGasTotal } from '../../helpers/utils/confirm-tx.util';
import ConfirmTokenTransactionBase from './confirm-token-transaction-base.component';

const mapStateToProps = (state, ownProps) => {
  const {
    match: { params = {} },
  } = ownProps;
  const { id: paramsTransactionId } = params;
  const {
    confirmTransaction,
    metamask: {
      currentCurrency,
      conversionRate,
      currentNetworkTxList,
      nativeCurrency,
    },
  } = state;

  const {
    txData: {
      id: transactionId,
      txParams: { to: tokenAddress, data, maxFeePerGas, gasPrice, gas } = {},
    } = {},
  } = confirmTransaction;

  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(
      getHexGasTotal({
        gasPrice: maxFeePerGas ?? gasPrice,
        gasLimit: gas,
      }),
    ),
  ).toFixed(6);

  const transaction =
    currentNetworkTxList.find(
      ({ id }) => id === (Number(paramsTransactionId) || transactionId),
    ) || {};

  const { ethTransactionTotal, fiatTransactionTotal } = transactionFeeSelector(
    state,
    transaction,
  );
  const tokens = getTokens(state);
  const currentToken = tokens?.find(({ address }) => tokenAddress === address);
  const { decimals, symbol: tokenSymbol } = currentToken || {};

  const tokenData = getTokenData(data);
  const tokenValue = getTokenValueParam(tokenData);
  const toAddress = getTokenAddressParam(tokenData);
  const tokenAmount =
    tokenData && calcTokenAmount(tokenValue, decimals).toFixed();
  const contractExchangeRate = contractExchangeRateSelector(state);

  return {
    toAddress,
    tokenAddress,
    tokenAmount,
    tokenSymbol,
    currentCurrency,
    conversionRate,
    contractExchangeRate,
    fiatTransactionTotal,
    ethTransactionTotal,
    ethTransactionTotalMaxAmount,
    nativeCurrency,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ConfirmTokenTransactionBase);
