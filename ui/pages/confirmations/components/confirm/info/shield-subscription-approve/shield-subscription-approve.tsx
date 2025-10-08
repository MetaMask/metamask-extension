import { Box } from '@metamask/design-system-react';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  ProductPrice,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import { useUserSubscriptions } from '../../../../../../hooks/subscription/useSubscription';
import { useConfirmContext } from '../../../../context/confirm';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import {
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
  useSubscriptionProductPlans,
} from '../../../../../../hooks/subscription/useSubscriptionPricing';
import { useAsyncResult } from '../../../../../../hooks/useAsync';
import { getSubscriptionCryptoApprovalAmount } from '../../../../../../store/actions';
import { AccountDetails } from './account-details';
import { EstimatedChanges } from './estimated-changes';
import ShieldSubscriptionApproveLoader from './shield-subscription-approve-loader';
import { SubscriptionDetails } from './subscription-details';

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

  const { subscriptionPricing } = useSubscriptionPricing();
  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );
  const selectedTokenPrice = useMemo(() => {
    return cryptoPaymentMethod?.chains
      ?.find(
        (chain) =>
          chain.chainId.toLowerCase() ===
          transactionMeta?.chainId.toLowerCase(),
      )
      ?.tokens.find(
        (token) =>
          token.address.toLowerCase() ===
          transactionMeta?.txParams?.to?.toLowerCase(),
      );
  }, [cryptoPaymentMethod, transactionMeta]);

  // need to do async here since `getSubscriptionCryptoApprovalAmount` make call to background script
  const { value: productPrice } = useAsyncResult(async (): Promise<
    ProductPrice | undefined
  > => {
    if (selectedTokenPrice) {
      const params = {
        chainId: transactionMeta?.chainId as Hex,
        paymentTokenAddress: selectedTokenPrice.address as Hex,
        productType: PRODUCT_TYPES.SHIELD,
      };
      const [monthlyApprovalAmount, yearlyApprovalAmount] = await Promise.all([
        getSubscriptionCryptoApprovalAmount({
          ...params,
          interval: RECURRING_INTERVALS.month,
        }),
        getSubscriptionCryptoApprovalAmount({
          ...params,
          interval: RECURRING_INTERVALS.year,
        }),
      ]);

      if (monthlyApprovalAmount.approveAmount === decodedApprovalAmount) {
        return pricingPlans?.find(
          (plan) => plan.interval === RECURRING_INTERVALS.month,
        );
      }
      if (yearlyApprovalAmount.approveAmount === decodedApprovalAmount) {
        return pricingPlans?.find(
          (plan) => plan.interval === RECURRING_INTERVALS.year,
        );
      }
    }

    return undefined;
  }, [
    transactionMeta,
    selectedTokenPrice,
    decodedApprovalAmount,
    pricingPlans,
  ]);

  const { trialedProducts, loading: subscriptionsLoading } =
    useUserSubscriptions();
  const isTrialed = trialedProducts?.includes(PRODUCT_TYPES.SHIELD);

  const isLoading =
    subscriptionsLoading || decodeResponse?.pending || !decimals;
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
      <GasFeesSection />
    </Box>
  );
};

export default ShieldSubscriptionApproveInfo;
