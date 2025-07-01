import { Hex } from '@metamask/utils';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../store/actions';
import { NATIVE_TOKEN_ADDRESS } from '../../../../helpers/constants/intents';

export function useTokenDecimals({
  chainId,
  tokenAddresses,
}: {
  chainId?: Hex;
  tokenAddresses?: Hex[];
}) {
  return useAsyncResult(async () => {
    if (!chainId || !tokenAddresses?.length) {
      return undefined;
    }

    return await Promise.all(
      tokenAddresses.map((tokenAddress) =>
        getTokenDecimal(tokenAddress, chainId),
      ),
    );
  }, [chainId, JSON.stringify(tokenAddresses)]);
}

async function getTokenDecimal(
  tokenAddress: Hex,
  chainId: Hex,
): Promise<number | undefined> {
  if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
    return 18;
  }

  const details = await getTokenStandardAndDetailsByChain(
    tokenAddress,
    undefined,
    undefined,
    chainId,
  );

  if (!details.decimals) {
    return undefined;
  }

  return parseInt(details.decimals, 10);
}
