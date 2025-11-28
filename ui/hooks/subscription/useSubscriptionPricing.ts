import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import {
  ChainPaymentInfo,
  PaymentType,
  PricingPaymentMethod,
  PricingResponse,
  ProductPrice,
  ProductType,
  TokenPaymentInfo,
} from '@metamask/subscription-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { getSubscriptionPricing } from '../../selectors/subscription';
import {
  getSubscriptionCryptoApprovalAmount,
  getSubscriptionPricing as getSubscriptionPricingAction,
} from '../../store/actions';
import { getTokenBalancesEvm } from '../../selectors/assets';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../useTokenBalances';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../../shared/constants/transaction';
import { useAsyncResult } from '../useAsync';
import {
  getAccountGroupsByAddress,
  getInternalAccountByGroupAndCaip,
  getSelectedAccountGroup,
} from '../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';

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

/**
 * get user available token balances for starting subscription
 *
 * @param params
 * @param params.paymentChains - The payment chains info.
 * @param params.price - The product price.
 * @param params.productType - The product type.
 * @returns The available token balances.
 */
export const useAvailableTokenBalances = (params: {
  paymentChains?: ChainPaymentInfo[];
  price?: ProductPrice;
  productType: ProductType;
}): {
  availableTokenBalances: TokenWithApprovalAmount[];
  pending: boolean;
  error: Error | undefined;
} => {
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

  // Use accountAddress's account group if it exists, otherwise use the selected account group
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const [requestedAccountGroup] = useSelector((state) =>
    getAccountGroupsByAddress(state as MultichainAccountsState, ['']),
  );
  const accountGroupIdToUse = requestedAccountGroup?.id ?? selectedAccountGroup;

  // Get internal account to use for each supported scope
  const evmAccount = useSelector((state) =>
    getInternalAccountByGroupAndCaip(state, accountGroupIdToUse, 'eip155:1'),
  );
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, evmAccount?.address),
  );

  // Poll and update evm balances for payment chains
  pollAndUpdateEvmBalances({ chainIds: paymentChainIds });

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

  const {
    value: availableTokenBalances,
    pending,
    error,
  } = useAsyncResult(async (): Promise<TokenWithApprovalAmount[]> => {
    if (!price || !paymentChainTokenMap) {
      return [];
    }

    const availableTokens: TokenWithApprovalAmount[] = [];

    const cryptoApprovalAmounts = await Promise.all(
      validTokenBalances.map((token) => {
        const tokenPaymentInfo = paymentChainTokenMap?.[
          token.chainId as Hex
        ]?.find((t) => t.address.toLowerCase() === token.address.toLowerCase());
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

      const balance = new BigNumber(token.balance);
      // required amount for subscription is only 1 billing cycle, only approve amount need minBillingCycles
      // price amount and token balance has different decimals, so we need to convert the price amount to the same decimals as the token balance
      const requiredAmount = new BigNumber(price.unitAmount).div(
        new BigNumber(10).pow(price.unitDecimals),
      );
      const tokenHasEnoughBalance = amount && balance.gte(requiredAmount);
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

    return availableTokens;
  }, [price, productType, paymentChainTokenMap, validTokenBalances]);

  return {
    availableTokenBalances: availableTokenBalances ?? [],
    pending,
    error,
  };
};

/**
 * Use this hook to get the subscription pricing.
 *
 * @param options - The options for the hook.
 * @param options.refetch - Whether to refetch the subscription pricing from api.
 * @returns The subscription pricing.
 */
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
