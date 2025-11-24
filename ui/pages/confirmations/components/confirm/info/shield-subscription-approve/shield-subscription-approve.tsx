import { Box } from '@metamask/design-system-react';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
} from '@metamask/subscription-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useUserSubscriptions } from '../../../../../../hooks/subscription/useSubscription';
import { useConfirmContext } from '../../../../context/confirm';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import {
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
  useSubscriptionProductPlans,
} from '../../../../../../hooks/subscription/useSubscriptionPricing';
import { useDecodedTransactionDataValue } from '../../../../../../hooks/useDecodedTransactionData';
import { getLastUsedShieldSubscriptionPaymentDetails } from '../../../../../../selectors/subscription';
import { AccountDetails } from './account-details';
import { EstimatedChanges } from './estimated-changes';
import ShieldSubscriptionApproveLoader from './shield-subscription-approve-loader';
import { SubscriptionDetails } from './subscription-details';
import BillingDetails from './billing-details';

const ShieldSubscriptionApproveInfo = () => {
  const lastSelectedPaymentDetail = useSelector(
    getLastUsedShieldSubscriptionPaymentDetails,
  );
  const { subscriptionPricing } = useSubscriptionPricing();
  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );
  const productPrice = pricingPlans?.find(
    (plan) => plan.interval === lastSelectedPaymentDetail?.plan,
  );
  const selectedTokenPrice = useMemo(() => {
    const tokenList = cryptoPaymentMethod?.chains?.flatMap(
      (chain) => chain.tokens,
    );
    return tokenList?.find(
      (token) =>
        token.address.toLowerCase() ===
        lastSelectedPaymentDetail?.paymentTokenAddress?.toLowerCase(),
    );
  }, [cryptoPaymentMethod, lastSelectedPaymentDetail]);

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { decodeResponse, value: decodedApprovalAmount } =
    useDecodedTransactionDataValue(transactionMeta);
  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
    transactionMeta.chainId,
  );
  const approvalAmount = useMemo(() => {
    const approvalAmountInWeiBn = new BigNumber(decodedApprovalAmount ?? 0);
    return approvalAmountInWeiBn.div(10 ** (decimals ?? 0)).toFixed();
  }, [decodedApprovalAmount, decimals]);

  const { trialedProducts } = useUserSubscriptions();
  const isTrialed = trialedProducts?.includes(PRODUCT_TYPES.SHIELD);

  const isLoading = decodeResponse?.pending || !decimals;
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
        tokenSymbol={selectedTokenPrice?.symbol}
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
