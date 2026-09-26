import { useSelector } from 'react-redux';
import { Token } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { getTokenBalances } from '../ducks/metamask/metamask';

export const useTokenBalances = () => {
  const tokenBalances = useSelector(getTokenBalances);

  return { tokenBalances };
};

// This hook is designed for backwards compatibility with `ui/hooks/useTokenTracker.js`
// and the github.com/MetaMask/eth-token-tracker library. Balances are sourced from
// AssetsController, so callers of this hook receive zero placeholders. It should not
// be used in new code; read balances from AssetsController selectors instead.
export const useTokenTracker = ({
  tokens,
}: {
  chainId: Hex;
  tokens: Token[];
  address: Hex;
  hideZeroBalanceTokens?: boolean;
}) => {
  return {
    tokensWithBalances: tokens.map((token) => ({
      ...token,
      balance: '0',
      balanceError: null,
      string: stringifyBalance('0', token.decimals),
    })),
  };
};

// From https://github.com/MetaMask/eth-token-tracker/blob/main/lib/util.js
// Ensures backwards compatibility with display formatting.
export function stringifyBalance(
  balance: string,
  tokenDecimals?: number,
  balanceDecimals = 5,
) {
  if (balance === '0') {
    return '0';
  }

  const parsed = Number(tokenDecimals);
  const decimals = Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;

  if (decimals === 0) {
    return balance;
  }

  let bal = balance;
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
