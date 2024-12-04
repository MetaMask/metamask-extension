import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTokenBalances } from './useTokenBalances';
import {
  getCurrencyRates,
  getMarketData,
  getSelectedAccount,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountTokensAcrossChains,
  selectERC20TokensByChain,
} from '../selectors';
import {
  ChainAddressMarketData,
  Token,
} from '../components/app/assets/token-list/token-list';
import { Hex } from '@metamask/utils';
import { calculateTokenFiatAmount } from '../components/app/assets/util/calculateTokenFiatAmount';
import { calculateTokenBalance } from '../components/app/assets/util/calculateTokenBalance';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
  TEST_CHAINS,
} from '../../shared/constants/network';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../shared/constants/transaction';

const useFilteredAccountTokens = () => {
  const selectedAccountTokensChains: Record<string, Token[]> = useSelector(
    getSelectedAccountTokensAcrossChains,
  ) as Record<string, Token[]>;

  const filteredAccountTokensChains = useMemo(() => {
    return Object.fromEntries(
      Object.entries(selectedAccountTokensChains).filter(
        ([chainId]) => !(TEST_CHAINS as string[]).includes(chainId),
      ),
    );
  }, [selectedAccountTokensChains, TEST_CHAINS]);

  return filteredAccountTokensChains;
};

// This hook is used to get the balances of all tokens across all chains
// native balances are included, with fields isNative=true and address=''
export const useMultichainBalances = () => {
  const selectedAccountTokensChains = useFilteredAccountTokens();
  const selectedAccount = useSelector(getSelectedAccount);

  const { tokenBalances } = useTokenBalances();
  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address];

  const marketData: ChainAddressMarketData = useSelector(
    getMarketData,
  ) as ChainAddressMarketData;

  const currencyRates = useSelector(getCurrencyRates);
  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  const erc20TokensByChain = useSelector(selectERC20TokensByChain);

  const assetsWithBalance = useMemo(() => {
    const tokensWithBalance: AssetWithDisplayData<ERC20Asset | NativeAsset>[] =
      [];

    Object.entries(selectedAccountTokensChains).forEach(
      ([stringChainKey, tokens]) => {
        const chainId = stringChainKey as Hex;
        tokens.forEach((token: Token) => {
          const { isNative, address, decimals } = token;
          const balance =
            calculateTokenBalance({
              isNative,
              chainId,
              address,
              decimals,
              nativeBalances,
              selectedAccountTokenBalancesAcrossChains,
            }) || '';

          const tokenFiatAmount = calculateTokenFiatAmount({
            token,
            chainId,
            balance,
            marketData,
            currencyRates,
          });

          // Append processed token with balance and fiat amount
          const sharedFields = {
            balance,
            tokenFiatAmount,
            chainId,
            string: String(balance),
          };
          if (token.isNative) {
            tokensWithBalance.push({
              ...sharedFields,
              type: AssetType.native,
              image:
                CHAIN_ID_TOKEN_IMAGE_MAP[
                  chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
                ],
              symbol:
                CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
                  chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
                ],
              decimals: token.decimals,
            });
          } else {
            tokensWithBalance.push({
              ...token,
              ...sharedFields,
              image:
                token.image ||
                erc20TokensByChain[chainId]?.data?.[token.address.toLowerCase()]
                  ?.iconUrl,
              address: token.address,
              type: AssetType.token,
            });
          }
        });
      },
    );

    return tokensWithBalance.sort(
      (a, b) => (b.tokenFiatAmount ?? 0) - (a.tokenFiatAmount ?? 0),
    );
  }, [JSON.stringify(selectedAccountTokensChains)]);

  const balanceByChainId = useMemo(() => {
    return assetsWithBalance.reduce(
      (acc: Record<`0x${string}`, number>, { chainId, tokenFiatAmount }) => {
        if (!acc[chainId]) {
          acc[chainId] = 0;
        }
        if (tokenFiatAmount) {
          acc[chainId] += tokenFiatAmount;
        }
        return acc;
      },
      {},
    );
  }, [assetsWithBalance]);

  return { assetsWithBalance, balanceByChainId };
};
