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
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
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

  const transactionData = getTransactionData(data);
  const toAddress = getTokenAddressParam(transactionData);
  const tokenAmountOrTokenId = getTokenValueParam(transactionData);
  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(hexMaximumTransactionFee),
  ).toFixed(6);

  const currentToken = tokens?.find(({ address }) =>
    isEqualCaseInsensitive(tokenAddress, address),
  );
  const currentCollectible = collectibles?.find(
    ({ address, tokenId }) =>
      isEqualCaseInsensitive(tokenAddress, address) &&
      tokenId === tokenAmountOrTokenId,
  );

  let image,
    tokenId,
    collectibleName,
    tokenAmount,
    contractExchangeRate,
    title,
    subtitle;

  if (currentCollectible) {
    ({ image, tokenId, name: collectibleName } = currentCollectible || {});

    title = collectibleName;
    subtitle = `#${tokenId}`;
  } else if (currentToken) {
    const { decimals, symbol: tokenSymbol } = currentToken || {};
    tokenAmount =
      transactionData &&
      calcTokenAmount(tokenAmountOrTokenId, decimals).toFixed();
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
