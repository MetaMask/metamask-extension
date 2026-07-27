import { useMemo } from 'react';
import { getTokenValueParam } from '../../shared/lib/metamask-controller-utils';
import { calcTokenAmount } from '../../shared/lib/transactions-controller-utils';
import { useTokenData } from './useTokenData';

/**
 * Defines the shape for the Token input parameter for useTokenDisplayValue
 */
export type Token = {
  /** The string to use as a suffix for the token (eg. DAI) */
  symbol: string;
  /** The number of decimals to show when displaying this type of token */
  decimals: number | null | undefined;
};

/**
 * useTokenDisplayValue
 * Given the data string from txParams and a token object with symbol and decimals, return
 * a displayValue that represents a string representing that token amount as a string. Also
 * return a tokenData object for downstream usage and the suffix for the token to use as props
 * for other hooks and/or components
 *
 * @param transactionData - Raw data string from token transaction
 * @param token - The token associated with this transaction
 * @param isTokenTransaction - Due to the nature of hooks, it isn't possible
 * to conditionally call this hook. This flag will force this hook to return
 * null if it set as false which indicates the transaction is not associated
 * with a token.
 * @returns The computed displayValue of the provided transactionData and token
 */
export function useTokenDisplayValue(
  transactionData?: string,
  token?: Token,
  isTokenTransaction = true,
): string | null {
  const tokenData = useTokenData(transactionData, isTokenTransaction);
  const tokenValue = getTokenValueParam(tokenData);

  const shouldCalculateTokenValue = Boolean(
    // If we are currently processing a token transaction
    isTokenTransaction &&
    // and raw transaction data string is provided
    transactionData &&
    // and a token object has been provided
    token &&
    // and the provided token object contains a defined decimal value we need to calculate amount
    token.decimals !== null &&
    token.decimals !== undefined &&
    // and we are able to parse the token detail we to calculate amount from the raw data
    tokenValue,
  );

  const displayValue = useMemo(() => {
    if (!shouldCalculateTokenValue) {
      return null;
    }

    return calcTokenAmount(tokenValue, (token as Token).decimals as number).toString(10);
  }, [shouldCalculateTokenValue, tokenValue, token]);

  return displayValue;
}
