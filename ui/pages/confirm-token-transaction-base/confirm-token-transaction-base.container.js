import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  contractExchangeRateSelector,
  transactionFeeSelector,
} from '../../selectors';
import { getCollectibles, getTokens } from '../../ducks/metamask/metamask';
import { getTransactionData } from '../../helpers/utils/transactions.util';
import {
  calcTokenAmount,
  getTokenAddressParam,
  getTokenValueParam,
} from '../../helpers/utils/token-util';
import { hexWEIToDecETH } from '../../helpers/utils/conversions.util';
import { isEqualCaseInsensitive } from '../../helpers/utils/util';
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
      txParams: { to: tokenAddress, data } = {},
    } = {},
  } = confirmTransaction;

  const transaction =
    currentNetworkTxList.find(
      ({ id }) => id === (Number(paramsTransactionId) || transactionId),
    ) || {};

  const {
    ethTransactionTotal,
    fiatTransactionTotal,
    hexMaximumTransactionFee,
  } = transactionFeeSelector(state, transaction);
  const tokens = getTokens(state);
  const collectibles = getCollectibles(state);

  const currentToken = tokens?.find(({ address }) =>
    isEqualCaseInsensitive(tokenAddress, address),
  );
  const currentCollectible = collectibles?.find(({ address }) =>
    isEqualCaseInsensitive(tokenAddress, address),
  );

  let image,
    tokenId,
    collectibleName,
    tokenValue,
    tokenAmount,
    contractExchangeRate,
    title,
    subtitle;

  const transactionData = getTransactionData(data);
  const toAddress = getTokenAddressParam(transactionData);
  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(hexMaximumTransactionFee),
  ).toFixed(6);

  if (currentCollectible) {
    ({ image, tokenId, name: collectibleName } = currentCollectible || {});

    title = collectibleName;
    subtitle = `#${tokenId}`;
  } else if (currentToken) {
    const { decimals, symbol: tokenSymbol } = currentToken || {};
    tokenValue = getTokenValueParam(transactionData);
    tokenAmount =
      transactionData && calcTokenAmount(tokenValue, decimals).toFixed();
    contractExchangeRate = contractExchangeRateSelector(state);
    title = `${tokenAmount} ${tokenSymbol}`;
  }

  return {
    title,
    subtitle,
    image,
    toAddress,
    tokenAddress,
    tokenAmount,
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
