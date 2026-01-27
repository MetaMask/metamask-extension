import { useDispatch, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';

import { useAsyncResult } from '../../../../hooks/useAsync';
import {
  addToken,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getAllTokens } from '../../../../selectors/selectors';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';

export function useAddToken({
  chainId,
  decimals,
  symbol,
  tokenAddress,
}: {
  chainId: Hex;
  decimals: number;
  symbol: string;
  tokenAddress: Hex;
}) {
  const dispatch = useDispatch();
  const allTokens = useSelector(getAllTokens);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const hasToken =
    allTokens?.[chainId]?.[selectedAccount?.address]?.some(
      (token: { address: string }) =>
        token.address.toLowerCase() === tokenAddress.toLowerCase(),
    ) ?? false;

  const { error } = useAsyncResult(async () => {
    if (hasToken) {
      return;
    }

    const networkClientId = await findNetworkClientIdByChainId(chainId);

    await dispatch(
      addToken(
        {
          address: tokenAddress,
          symbol,
          decimals,
          networkClientId,
        },
        true,
      ),
    );
  }, [hasToken, chainId, tokenAddress, symbol, decimals, dispatch]);

  if (error) {
    console.error('Failed to add token', { tokenAddress, chainId, error });
  }
}
