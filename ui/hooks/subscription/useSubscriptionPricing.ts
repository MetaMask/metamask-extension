import { useEffect, useMemo, useState } from 'react';
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

export type TokenWithApprovalAmount = (
  | AssetWithDisplayData<ERC20Asset>
  | AssetWithDisplayData<NativeAsset>
) & {
  approvalAmount: string;
};

export const useAvailableTokenBalances = (params: {
  paymentChains?: ChainPaymentInfo[];
  price?: ProductPrice;
}): TokenWithApprovalAmount[] => {
  const { paymentChains, price } = params;

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
            price,
            tokenPaymentInfo,
          });
        }),
      );

      cryptoApprovalAmounts.forEach((amount, index) => {
        const token = validTokenBalances[index];
        if (amount) {
          availableTokens.push({
            ...token,
            approvalAmount: amount,
            type: token.isNative ? AssetType.native : AssetType.token,
          } as TokenWithApprovalAmount);
        }
      });

      setAvailableTokenBalances(availableTokens);
    };

    getAvailableTokenBalances();
  }, [price, paymentChainTokenMap, validTokenBalances]);

  return availableTokenBalances;
};

export const useSubscriptionPricing = () => {
  const dispatch = useDispatch();
  const subscriptionPricing = useSelector(getSubscriptionPricing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await dispatch(getSubscriptionPricingAction());
      } catch (err) {
        log.error('[useSubscriptionPricing] error', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  return { subscriptionPricing, loading, error };
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
