import { useEffect, useState } from 'react';
import { getTokenStandardAndDetails } from '../store/actions';

export type TokenDetails = Awaited<
  ReturnType<typeof getTokenStandardAndDetails>
>;

/**
 * Use token details for a list of token addresses.
 *
 * @param tokenAddresses
 */
export function useTokenDetails(tokenAddresses: string[]) {
  const [isLoading, setLoading] = useState(false);
  const [addressToTokenDetails, setAddressToTokenDetails] = useState<
    Record<string, TokenDetails>
  >({});

  useEffect(() => {
    if (tokenAddresses.length === 0) {
      return;
    }
    async function fetchTokenDetails() {
      setLoading(true);
      const allTokenData = await Promise.all(
        tokenAddresses.map((address) => getTokenStandardAndDetails(address)),
      );
      setAddressToTokenDetails(
        allTokenData.reduce(
          (result, tokenData, index) => ({
            ...result,
            [tokenAddresses[index]]: tokenData,
          }),
          {},
        ),
      );
      setLoading(false);
    }
    fetchTokenDetails();
  }, [tokenAddresses]);

  return { isLoading, addressToTokenDetails };
}
