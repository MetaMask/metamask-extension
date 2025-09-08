import { useCallback } from 'react';
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

  const getFilteredSnaps = useCallback(
    (chainId: string, domain: string) => {
      return snaps
        .filter(({ permission }) => {
          const chainIdCaveat = getChainIdsCaveat(permission);

          if (chainIdCaveat && !chainIdCaveat.includes(chainId)) {
            return false;
          }

          const lookupMatchersCaveat = getLookupMatchersCaveat(permission);

          if (lookupMatchersCaveat) {
            const { tlds, schemes } = lookupMatchersCaveat;
            return (
              tlds?.some((tld) => domain.endsWith(`.${tld}`)) ||
              schemes?.some((scheme) => domain.startsWith(`${scheme}:`))
            );
          }

          return true;
        })
        .map(({ id }) => id);
    },
    [snaps],
  );

  const resolveNameLookup = useCallback(
    async (chainId: string, domain: string) => {
      try {
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
          .filter(
            (response) => response.status === 'fulfilled' && response.value,
          )
          .flatMap(
            (response) =>
              (response as PromiseFulfilledResult<DomainLookupResult>).value
                .resolvedAddresses,
          );

        return resolutions;
      } catch (error) {
        console.error('Error resolving name lookup:', error);
        return [];
      }
    },
    [getFilteredSnaps],
  );

  return resolveNameLookup;
}
