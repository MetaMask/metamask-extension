import { Hex } from '@metamask/utils';
import {
  ChainAddressMarketData,
  Token,
  TokenWithFiatAmount,
} from '../token-list/token-list';
import { calculateTokenBalance } from './calculateTokenBalance';
import {
  SymbolCurrencyRateMapping,
  calculateTokenFiatAmount,
} from './calculateTokenFiatAmount';

export const consolidateTokenBalances = (
  selectedAccountTokensChains: Record<string, Token[]>,
  nativeBalances: Record<Hex, Hex>,
  selectedAccountTokenBalancesAcrossChains: Record<
    `0x${string}`,
    Record<`0x${string}`, `0x${string}`>
  >,
  marketData: ChainAddressMarketData,
  currencyRates: SymbolCurrencyRateMapping,
  hideZeroBalanceTokens: boolean,
  isOnCurrentNetwork: boolean,
) => {
  const tokensWithBalance: TokenWithFiatAmount[] = [];
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
          }) || '0';

        const tokenFiatAmount = calculateTokenFiatAmount({
          token,
          chainId,
          balance,
          marketData,
          currencyRates,
        });

        // Respect the "hide zero balance" setting (when true):
        // - Native tokens should always display with zero balance when on the current network filter.
        // - Native tokens should not display with zero balance when on all networks filter
        // - ERC20 tokens with zero balances should respect the setting on both the current and all networks.

        // Respect the "hide zero balance" setting (when false):
        // - Native tokens should always display with zero balance when on the current network filter.
        // - Native tokens should always display with zero balance when on all networks filter
        // - ERC20 tokens always display with zero balance on both the current and all networks filter.
        if (
          !hideZeroBalanceTokens ||
          balance !== '0' ||
          (token.isNative && isOnCurrentNetwork)
        ) {
          tokensWithBalance.push({
            ...token,
            balance,
            tokenFiatAmount,
            chainId,
            string: String(balance),
          });
        }
      });
    },
  );

  return tokensWithBalance;
};
