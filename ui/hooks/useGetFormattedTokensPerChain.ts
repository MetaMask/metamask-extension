import { useSelector } from 'react-redux';
import { BN } from 'bn.js';
import {
  getNetworkConfigurationsByChainId,
  getAllTokens,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getCurrentChainId,
} from '../selectors';
import { hexToDecimal } from '../../shared/modules/conversion.utils';

import { TEST_CHAINS } from '../../shared/constants/network';
import { stringifyBalance, useTokenBalances } from './useTokenBalances';
import { TokenWithBalance } from '../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { Token } from '@metamask/assets-controllers';

type AddressMapping = {
  [chainId: string]: {
    [tokenAddress: string]: string;
  };
};

type TokenBalancesMapping = {
  [address: string]: AddressMapping;
};

export const useGetFormattedTokensPerChain = (
  account: { address: string },
  shouldHideZeroBalanceTokens: boolean,
) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const currentChainId = useSelector(getCurrentChainId);
  // We want to filter out test chains
  const allChainIDs = Object.keys(allNetworks).filter(
    (singleChainId) =>
      !TEST_CHAINS.includes(singleChainId as (typeof TEST_CHAINS)[number]),
  );
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const importedTokens = useSelector(getAllTokens); // returns the tokens only when they are imported
  const currentTokenBalances: { tokenBalances: TokenBalancesMapping } =
    useTokenBalances({
      chainIds: allChainIDs as `0x${string}`[],
    });

  // We will calculate aggregated balance only after the user imports the tokens to the wallet
  // we need to format the balances we get from useTokenBalances and match them with symbol and decimals we get from getAllTokens
  const networksToFormat = isTokenNetworkFilterEqualCurrentNetwork
    ? [currentChainId]
    : allChainIDs;
  const formattedTokensWithBalancesPerChain = networksToFormat.map(
    (singleChain) => {
      const tokens = importedTokens?.[singleChain]?.[account?.address] ?? [];

      const tokensWithBalances = tokens.reduce(
        (acc: TokenWithBalance[], token: Token) => {
          const hexBalance =
            currentTokenBalances.tokenBalances[account.address]?.[
              singleChain
            ]?.[token.address] ?? '0x0';
          if (hexBalance !== '0x0' || !shouldHideZeroBalanceTokens) {
            const decimalBalance = hexToDecimal(hexBalance);
            acc.push({
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              balance: decimalBalance,
              string: stringifyBalance(
                new BN(decimalBalance),
                new BN(token.decimals),
              ),
            });
          }
          return acc;
        },
        [],
      );

      return {
        chainId: singleChain,
        tokensWithBalances,
      };
    },
  );

  return {
    formattedTokensWithBalancesPerChain,
  };
};
