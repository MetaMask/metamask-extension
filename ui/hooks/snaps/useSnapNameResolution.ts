import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getChainIdsCaveat,
  getLookupMatchersCaveat,
} from '@metamask/snaps-rpc-methods';
import { AddressResolution, DomainLookupResult } from '@metamask/snaps-sdk';
import { getNameLookupSnaps } from '../../selectors';
import { handleSnapRequest } from '../../store/actions';

/**
 * A hook for using Snaps to resolve domain names for a given chain ID.
 *
 * @param options - An options bag.
 * @param options.chainId - A CAIP-2 chain ID.
 * @param options.domain - The domain to resolve.
 * @returns The results of the name resolution and a flag to determine if the
 * results are loading.
 */
export function useSnapNameResolution({
  chainId,
  domain,
}: {
  chainId: string;
  domain: string;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<AddressResolution[] | undefined>(
    undefined,
  );

  const snaps = useSelector(getNameLookupSnaps);

  const filteredSnaps = useMemo(
    () =>
      snaps
        .filter(({ permission }) => {
          const chainIdCaveat = getChainIdsCaveat(permission);
          const lookupMatchersCaveat = getLookupMatchersCaveat(permission);

          if (chainIdCaveat && !chainIdCaveat.includes(chainId)) {
            return false;
          }

          if (lookupMatchersCaveat) {
            const { tlds, schemes } = lookupMatchersCaveat;
            return (
              tlds?.some((tld) => domain.endsWith(`.${tld}`)) ||
              schemes?.some((scheme) => domain.startsWith(`${scheme}:`))
            );
          }

          return true;
        })
        .map(({ id }) => id),
    [snaps, chainId],
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchResolutions() {
      setLoading(true);

      const responses = await Promise.allSettled(
        filteredSnaps.map(
          (id) =>
            handleSnapRequest({
              snapId: id,
              origin: 'metamask',
              handler: 'onNameLookup',
              request: {
                jsonrpc: '2.0',
                method: ' ',
                params: {
                  chainId,
                  domain,
                },
              },
            }) as Promise<DomainLookupResult>,
        ),
      );

      if (!cancelled) {
        const resolutions = responses
          .filter(
            (response) => response.status === 'fulfilled' && response.value,
          )
          .flatMap(
            (response) =>
              (response as PromiseFulfilledResult<DomainLookupResult>).value
                .resolvedAddresses,
          );
        setResults(resolutions);
        setLoading(false);
      }
    }

    fetchResolutions();

    return () => {
      cancelled = true;
    };
  }, [filteredSnaps, domain]);

  return { results, loading };
}
