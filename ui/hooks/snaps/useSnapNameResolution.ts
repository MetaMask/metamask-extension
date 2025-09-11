import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getChainIdsCaveat,
  getLookupMatchersCaveat,
} from '@metamask/snaps-rpc-methods';
import { DomainLookupResult } from '@metamask/snaps-sdk';
import { getNameLookupSnaps } from '../../selectors';
import { handleSnapRequest } from '../../store/actions';

/**
 * A hook for using Snaps to lookup domains for a given chain ID.
 * Returns a callback function that lookups domains on-demand.
 *
 * @returns The resolve callback function.
 */
export function useSnapNameResolution() {
  const snaps = useSelector(getNameLookupSnaps);

  const processedSnaps = useMemo(
    () =>
      snaps.map((snap) => {
        const chainIdCaveat = getChainIdsCaveat(snap.permission);
        const lookupMatchersCaveat = getLookupMatchersCaveat(snap.permission);

        return {
          id: snap.id,
          chainIdCaveat,
          lookupMatchersCaveat,
        };
      }),
    [snaps],
  );

  const getFilteredSnaps = useCallback(
    (chainId: string, domain: string) =>
      processedSnaps
        .filter(({ chainIdCaveat, lookupMatchersCaveat }) => {
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
    [processedSnaps],
  );

  const lookupDomainAddresses = useCallback(
    async (chainId: string, domain: string) => {
      const filteredSnaps = getFilteredSnaps(chainId, domain);

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

      const resolutions = responses
        .filter((response) => response.status === 'fulfilled' && response.value)
        .flatMap(
          (response) =>
            (response as PromiseFulfilledResult<DomainLookupResult>).value
              .resolvedAddresses,
        );

      return resolutions;
    },
    [getFilteredSnaps],
  );

  return { lookupDomainAddresses };
}
