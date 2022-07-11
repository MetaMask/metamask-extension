import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import {
  CONFIRM_APPROVE_PATH,
  CONFIRM_SAFE_TRANSFER_FROM_PATH,
  CONFIRM_SEND_TOKEN_PATH,
  CONFIRM_SET_APPROVAL_FOR_ALL_PATH,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_TRANSFER_FROM_PATH,
} from '../../helpers/constants/routes';
import { transactionFeeSelector } from '../../selectors';
import ConfirmApprove from '../confirm-approve';
import ConfirmSendToken from '../confirm-send-token';
import ConfirmTokenTransactionBase from '../confirm-token-transaction-base';
import ConfirmTransactionSwitch from '../confirm-transaction-switch';

import { useAssetDetails } from '../../hooks/useAssetDetails';

export default function ConfirmTokenTransactionSwitch({ transaction }) {
  const {
    txParams: { data, to: tokenAddress, from: userAddress } = {},
  } = transaction;

  const {
    assetStandard,
    assetName,
    userBalance,
    tokenSymbol,
    decimals,
    tokenImage,
    tokenAmount,
    tokenId,
    toAddress,
  } = useAssetDetails(tokenAddress, userAddress, data);

  const {
    ethTransactionTotal,
    fiatTransactionTotal,
    hexTransactionTotal,
    hexMaximumTransactionFee,
  } = useSelector((state) => transactionFeeSelector(state, transaction));

  return (
    <Switch>
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_APPROVE_PATH}`}
        render={() => (
          <ConfirmApprove
            assetStandard={assetStandard}
            assetName={assetName}
            userBalance={userBalance}
            tokenSymbol={tokenSymbol}
            decimals={decimals}
            tokenImage={tokenImage}
            tokenAmount={tokenAmount}
            tokenId={tokenId}
            userAddress={userAddress}
            tokenAddress={tokenAddress}
            toAddress={toAddress}
            transaction={transaction}
            ethTransactionTotal={ethTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
            hexTransactionTotal={hexTransactionTotal}
          />
        )}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_SET_APPROVAL_FOR_ALL_PATH}`}
        render={() => (
          <ConfirmApprove
            isSetApproveForAll
            assetStandard={assetStandard}
            assetName={assetName}
            userBalance={userBalance}
            tokenSymbol={tokenSymbol}
            decimals={decimals}
            tokenImage={tokenImage}
            tokenAmount={tokenAmount}
            tokenId={tokenId}
            userAddress={userAddress}
            tokenAddress={tokenAddress}
            toAddress={toAddress}
            transaction={transaction}
            ethTransactionTotal={ethTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
            hexTransactionTotal={hexTransactionTotal}
          />
        )}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_TRANSFER_FROM_PATH}`}
        render={() => (
          <ConfirmTokenTransactionBase
            assetStandard={assetStandard}
            assetName={assetName}
            userBalance={userBalance}
            tokenSymbol={tokenSymbol}
            decimals={decimals}
            image={tokenImage}
            tokenAddress={tokenAddress}
            toAddress={toAddress}
            tokenAmount={tokenAmount}
            tokenId={tokenId}
            userAddress={userAddress}
            transaction={transaction}
            ethTransactionTotal={ethTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
            hexMaximumTransactionFee={hexMaximumTransactionFee}
          />
        )}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_SAFE_TRANSFER_FROM_PATH}`}
        render={() => (
          <ConfirmTokenTransactionBase
            assetStandard={assetStandard}
            assetName={assetName}
            userBalance={userBalance}
            tokenSymbol={tokenSymbol}
            decimals={decimals}
            image={tokenImage}
            tokenAddress={tokenAddress}
            toAddress={toAddress}
            tokenAmount={tokenAmount}
            tokenId={tokenId}
            userAddress={userAddress}
            transaction={transaction}
            ethTransactionTotal={ethTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
            hexMaximumTransactionFee={hexMaximumTransactionFee}
          />
        )}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_SEND_TOKEN_PATH}`}
        render={() => (
          <ConfirmSendToken
            assetStandard={assetStandard}
            assetName={assetName}
            tokenSymbol={tokenSymbol}
            image={tokenImage}
            tokenAddress={tokenAddress}
            toAddress={toAddress}
            tokenAmount={tokenAmount}
            tokenId={tokenId}
            transaction={transaction}
            ethTransactionTotal={ethTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
            hexMaximumTransactionFee={hexMaximumTransactionFee}
          />
        )}
      />
      <Route path="*" component={ConfirmTransactionSwitch} />
    </Switch>
  );
}

ConfirmTokenTransactionSwitch.propTypes = {
  transaction: PropTypes.shape({
    origin: PropTypes.string,
    txParams: PropTypes.shape({
      data: PropTypes.string,
      to: PropTypes.string,
      from: PropTypes.string,
    }),
  }),
};
