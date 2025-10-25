import { Box } from '@metamask/design-system-react';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import React from 'react';
import { useUserSubscriptions } from '../../../../../../hooks/subscription/useSubscription';
import { useConfirmContext } from '../../../../context/confirm';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { useShieldSubscriptionPricingFromTokenApproval } from '../../../../../../hooks/subscription/useSubscriptionPricing';
import { AccountDetails } from './account-details';
import { EstimatedChanges } from './estimated-changes';
import ShieldSubscriptionApproveLoader from './shield-subscription-approve-loader';
import { SubscriptionDetails } from './subscription-details';
import BillingDetails from './billing-details';

const ShieldSubscriptionApproveInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const decodeResponse = useDecodedTransactionData({
    data: transactionMeta.txParams.data as Hex,
    to: transactionMeta.txParams.to as Hex,
  });
  const decodedApprovalAmount = decodeResponse?.value?.data[0].params.find(
    (param) => param.name === 'value',
  )?.value;
  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
    transactionMeta.chainId,
  );
  const approvalAmountInWeiBn = new BigNumber(decodedApprovalAmount ?? 0);
  const approvalAmount = approvalAmountInWeiBn
    .div(10 ** (decimals ?? 0))
    .toFixed();

  const { productPrice, pending: productPricePending } =
    useShieldSubscriptionPricingFromTokenApproval({
      transactionMeta,
      decodedApprovalAmount,
    });

  const { trialedProducts, loading: subscriptionsLoading } =
    useUserSubscriptions();
  const isTrialed = trialedProducts?.includes(PRODUCT_TYPES.SHIELD);

  const isLoading =
    subscriptionsLoading ||
    decodeResponse?.pending ||
    !decimals ||
    productPricePending;
  if (isLoading) {
    return <ShieldSubscriptionApproveLoader />;
  }

  return (
    <Box paddingTop={4}>
      <SubscriptionDetails showTrial={!isTrialed} productPrice={productPrice} />
      <EstimatedChanges
        approvalAmount={approvalAmount}
        tokenAddress={transactionMeta?.txParams?.to as Hex}
        chainId={transactionMeta?.chainId}
        productPrice={productPrice}
      />
      <AccountDetails
        accountAddress={transactionMeta?.txParams?.from as Hex}
        chainId={transactionMeta?.chainId}
      />
      {productPrice && (
        <BillingDetails
          productPrice={productPrice}
          isTrialSubscription={!isTrialed}
        />
      )}
      <GasFeesSection />
    </Box>
  );
};

export default ShieldSubscriptionApproveInfo;
