import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import {
  ChainPaymentInfo,
  PAYMENT_TYPES,
  PaymentType,
  PricingPaymentMethod,
  PricingResponse,
  PRODUCT_TYPES,
  ProductPrice,
  ProductType,
  RECURRING_INTERVALS,
  TokenPaymentInfo,
} from '@metamask/subscription-controller';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { getSubscriptionPricing } from '../../selectors/subscription';
import {
  getSubscriptionCryptoApprovalAmount,
  getSubscriptionPricing as getSubscriptionPricingAction,
} from '../../store/actions';
import { getSelectedAccount } from '../../selectors';
import { getTokenBalancesEvm } from '../../selectors/assets';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../useTokenBalances';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../../shared/constants/transaction';
import { useAsyncResult } from '../useAsync';

export type TokenWithApprovalAmount = (
  | AssetWithDisplayData<ERC20Asset>
  | AssetWithDisplayData<NativeAsset>
) & {
  approvalAmount: {
    approveAmount: string;
    chainId: Hex;
    paymentAddress: Hex;
    paymentTokenAddress: Hex;
  };
};

export const useAvailableTokenBalances = (params: {
  paymentChains?: ChainPaymentInfo[];
  price?: ProductPrice;
  productType: ProductType;
}): TokenWithApprovalAmount[] => {
  const { paymentChains, price, productType } = params;

  const paymentChainIds = useMemo(
    () => paymentChains?.map((chain) => chain.chainId),
    [paymentChains],
  );
  const paymentChainTokenMap = useMemo(
    () =>
      paymentChains?.reduce(
        (acc, chain) => {
          acc[chain.chainId] = chain.tokens;
          return acc;
        },
        {} as Record<Hex, TokenPaymentInfo[]>,
      ),
    [paymentChains],
  );

  const selectedAccount = useSelector(getSelectedAccount);
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount.address),
  );

  // Poll and update evm balances for payment chains
  pollAndUpdateEvmBalances({ chainIds: paymentChainIds });

  const [availableTokenBalances, setAvailableTokenBalances] = useState<
    TokenWithApprovalAmount[]
  >([]);

  const validTokenBalances = useMemo(() => {
    return evmBalances.filter((token) => {
      const supportedTokensForChain =
        paymentChainTokenMap?.[token.chainId as Hex];
      const isSupportedChain = Boolean(supportedTokensForChain);
      if (!isSupportedChain) {
        return false;
      }
      const isSupportedToken = supportedTokensForChain?.some(
        (t) => t.address.toLowerCase() === token.address.toLowerCase(),
      );
      if (!isSupportedToken) {
        return false;
      }
      const hasBalance = token.balance && parseFloat(token.balance) > 0;
      if (!hasBalance) {
        return false;
      }
      return true;
    });
  }, [evmBalances, paymentChainTokenMap]);

  useEffect(() => {
    if (!price || !paymentChainTokenMap) {
      return;
    }

    const getAvailableTokenBalances = async () => {
      const availableTokens: TokenWithApprovalAmount[] = [];

      const cryptoApprovalAmounts = await Promise.all(
        validTokenBalances.map((token) => {
          const tokenPaymentInfo = paymentChainTokenMap?.[
            token.chainId as Hex
          ]?.find(
            (t) => t.address.toLowerCase() === token.address.toLowerCase(),
          );
          if (!tokenPaymentInfo) {
            log.error(
              '[useAvailableTokenBalances] tokenPaymentInfo not found',
              token,
            );
            return null;
          }
          return getSubscriptionCryptoApprovalAmount({
            chainId: token.chainId as Hex,
            paymentTokenAddress: token.address as Hex,
            productType,
            interval: price.interval,
          });
        }),
      );

      cryptoApprovalAmounts.forEach((amount, index) => {
        const token = validTokenBalances[index];
        if (!token.balance) {
          return;
        }
        // NOTE: we are using stable coin for subscription atm, so we need to scale the balance by the decimals
        const scaledFactor = 10n ** 6n;
        const scaledBalance =
          BigInt(Math.round(Number(token.balance) * Number(scaledFactor))) /
          scaledFactor;
        const tokenHasEnoughBalance =
          amount &&
          scaledBalance * BigInt(10 ** token.decimals) >=
            BigInt(amount.approveAmount);
        if (tokenHasEnoughBalance) {
          availableTokens.push({
            ...token,
            approvalAmount: {
              approveAmount: amount.approveAmount,
              chainId: token.chainId as Hex,
              paymentAddress: amount.paymentAddress,
              paymentTokenAddress: amount.paymentTokenAddress,
            },
            type: token.isNative ? AssetType.native : AssetType.token,
          } as TokenWithApprovalAmount);
        }
      });

      setAvailableTokenBalances(availableTokens);
    };

    getAvailableTokenBalances();
  }, [price, productType, paymentChainTokenMap, validTokenBalances]);

  return availableTokenBalances;
};

export const useSubscriptionPricing = (
  { refetch }: { refetch?: boolean } = { refetch: false },
) => {
  const dispatch = useDispatch();
  const subscriptionPricing = useSelector(getSubscriptionPricing);

  const { pending, error } = useAsyncResult(async () => {
    if (!refetch) {
      return undefined;
    }
    return await dispatch(getSubscriptionPricingAction());
  }, [dispatch, refetch]);

  return { subscriptionPricing, loading: pending, error };
};

export const useSubscriptionProductPlans = (
  productType: ProductType,
  pricing?: PricingResponse,
): ProductPrice[] | undefined => {
  return useMemo(
    () =>
      pricing?.products.find((product) => product.name === productType)?.prices,
    [pricing, productType],
  );
};

export const useSubscriptionPaymentMethods = (
  paymentType: PaymentType,
  pricing?: PricingResponse,
): PricingPaymentMethod | undefined => {
  return useMemo(
    () =>
      pricing?.paymentMethods.find(
        (paymentMethod) => paymentMethod.type === paymentType,
      ),
    [pricing, paymentType],
  );
};

/**
 * Use this hook to get the shield subscription price derived from transaction data.
 *
 * @param params - The parameters for the hook.
 * @param params.transactionMeta - The transaction meta.
 * @param params.decodedApprovalAmount - The decoded approval amount.
 * @returns The product price.
 */
export const useShieldSubscriptionPricingFromTokenApproval = ({
  transactionMeta,
  decodedApprovalAmount,
}: {
  transactionMeta?: TransactionMeta;
  decodedApprovalAmount?: string;
}) => {
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
  const { value: productPrice, pending } = useAsyncResult(async (): Promise<
    ProductPrice | undefined
  > => {
    if (selectedTokenPrice) {
      const params = {
        chainId: transactionMeta?.chainId as Hex,
        paymentTokenAddress: selectedTokenPrice.address as Hex,
        productType: PRODUCT_TYPES.SHIELD,
      };
      // Get all intervals from RECURRING_INTERVALS
      const intervals = Object.values(RECURRING_INTERVALS);

      // Fetch approval amounts for all intervals
      const approvalAmounts = await Promise.all(
        intervals.map((interval) =>
          getSubscriptionCryptoApprovalAmount({
            ...params,
            interval,
          }),
        ),
      );

      // Find the matching plan by comparing approval amounts
      for (let i = 0; i < approvalAmounts.length; i++) {
        if (approvalAmounts[i]?.approveAmount === decodedApprovalAmount) {
          return pricingPlans?.find((plan) => plan.interval === intervals[i]);
        }
      }
    }

    return undefined;
  }, [
    transactionMeta,
    selectedTokenPrice,
    decodedApprovalAmount,
    pricingPlans,
  ]);

  return { productPrice, pending };
};
