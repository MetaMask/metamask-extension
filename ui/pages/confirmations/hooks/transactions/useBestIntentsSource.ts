import BigNumber from 'bignumber.js';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { Hex, createProjectLogger } from '@metamask/utils';
import { useIntentsSourceFiat } from './useIntentsSourceFiat';
import { useMemo } from 'react';
import { NATIVE_TOKEN_ADDRESS } from '../../../../helpers/constants/intents';

const log = createProjectLogger('intents');

export function useBestIntentsSource() {
  const { sourceAmountFiatTotal } = useIntentsSourceFiat();

  const sourceAmountFiatNumber = new BigNumber(
    sourceAmountFiatTotal ?? '0',
  ).toNumber();

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const tokensWithBalance = sourceAmountFiatTotal
    ? multichainTokensWithBalance.filter(
        (token) => (token.tokenFiatAmount ?? 0) > sourceAmountFiatNumber,
      )
    : [];

  log('Tokens with balance', tokensWithBalance);

  const token = tokensWithBalance[0];

  log('Default token', token);

  const chainId = token?.chainId as Hex | undefined;
  const address = token
    ? (token.address as Hex) || NATIVE_TOKEN_ADDRESS
    : undefined;

  return useMemo(
    () =>
      chainId && address
        ? {
            chainId,
            address,
          }
        : undefined,
    [chainId, address],
  );
}
