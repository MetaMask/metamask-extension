import { useSelector } from 'react-redux';
import BN from 'bn.js';
import { Token } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import {
  tokenBalancesStartPolling,
  tokenBalancesStopPollingByPollingToken,
} from '../store/actions';
import { getTokenBalances } from '../ducks/metamask/metamask';
import { hexToDecimal } from '../../shared/modules/conversion.utils';
import useMultiPolling from './useMultiPolling';

export const useTokenBalances = ({ chainIds }: { chainIds?: Hex[] } = {}) => {
  const tokenBalances = useSelector(getTokenBalances);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const pollableChains = chainIds.length > 0 ? chainIds : Object.keys(networkConfigurations);

  useMultiPolling({
    startPolling: tokenBalancesStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: tokenBalancesStopPollingByPollingToken,
    input: [pollableChains],
  });

  return { tokenBalances };
};

// This hook is designed for backwards compatibility with `ui/hooks/useTokenTracker.js`
// and the github.com/MetaMask/eth-token-tracker library. It replaces RPC calls with
// reading state from `TokenBalancesController`. It should not be used in new code.
// Instead, prefer to use `useTokenBalances` directly, or compose higher level hooks from it.
export const useTokenTracker = ({
  chainId,
  tokens,
  address,
  hideZeroBalanceTokens,
}: {
  chainId: Hex;
  tokens: Token[];
  address: Hex;
  hideZeroBalanceTokens?: boolean;
}) => {
  const { tokenBalances } = useTokenBalances({ chainIds: [chainId] });

  const tokensWithBalances = tokens.reduce(
    (acc, token) => {
      const hexBalance =
        tokenBalances[address]?.[chainId]?.[token.address as Hex] ?? '0x0';
      if (hexBalance !== '0x0' || !hideZeroBalanceTokens) {
        const decimalBalance = hexToDecimal(hexBalance);
        acc.push({
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          balance: decimalBalance,
          balanceError: null,
          string: stringifyBalance(
            new BN(decimalBalance),
            new BN(token.decimals),
          ),
        });
      }
      return acc;
    },
    [] as (Token & {
      balance: string;
      string: string;
      balanceError: unknown;
    })[],
  );

  return {
    tokensWithBalances,
  };
};

// From https://github.com/MetaMask/eth-token-tracker/blob/main/lib/util.js
// Ensures backwards compatibility with display formatting.
export function stringifyBalance(
  balance: BN,
  bnDecimals: BN,
  balanceDecimals = 5,
) {
  if (balance.eq(new BN(0))) {
    return '0';
  }

  const decimals = parseInt(bnDecimals.toString(), 10);
  if (decimals === 0) {
    return balance.toString();
  }

  let bal = balance.toString();
  let len = bal.length;
  let decimalIndex = len - decimals;
  let prefix = '';

  if (decimalIndex <= 0) {
    while (prefix.length <= decimalIndex * -1) {
      prefix += '0';
      len += 1;
    }
    bal = prefix + bal;
    decimalIndex = 1;
  }

  const whole = bal.substr(0, len - decimals);

  if (balanceDecimals === 0) {
    return whole;
  }

  const fractional = bal.substr(decimalIndex, balanceDecimals);
  if (/0+$/u.test(fractional)) {
    let withOnlySigZeroes = bal.substr(decimalIndex).replace(/0+$/u, '');
    if (withOnlySigZeroes.length > 0) {
      withOnlySigZeroes = `.${withOnlySigZeroes}`;
    }
    return `${whole}${withOnlySigZeroes}`;
  }
  return `${whole}.${fractional}`;
}
