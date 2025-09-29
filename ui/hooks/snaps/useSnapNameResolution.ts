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
 * A hook for using Snaps to resolve domain names for a given chain ID.
 *
 * @returns Function to get domain name resolutions.
 */
export function useSnapNameResolution() {
  const snaps = useSelector(getNameLookupSnaps);

  /**
   * Filters the available snaps based on the provided chain ID and domain.
   *
   * @param chainId - The CAIP-2 chain ID.
   * @param domain - The domain to resolve.
   * @returns The filtered snap IDs.
   */
  const getAvailableSnaps = useCallback(
    (chainId: string, domain: string) =>
      snaps
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
        .map(({ id }) => id),
    [snaps],
  );

  /**
   * Fetches name resolutions from the available snaps for the given chain ID and domain.
   *
   * @param chainId - The CAIP-2 chain ID.
   * @param domain - The domain to resolve.
   * @returns An object containing the resolutions and any errors encountered.
   */
  const fetchResolutions = useCallback(
    async (chainId: string, domain: string) => {
      const availableSnaps = getAvailableSnaps(chainId, domain);

      if (availableSnaps.length === 0) {
        return [];
      }

      const responses = await Promise.allSettled(
        availableSnaps.map(
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

      /**
       * Filters the responses from the snap requests into successful resolutions and errors.
       */
      const resolutions = responses
        .filter((response) => response.status === 'fulfilled' && response.value)
        .flatMap(
          (response) =>
            (response as PromiseFulfilledResult<DomainLookupResult>).value
              .resolvedAddresses,
        );

      return resolutions;
    },
    [getAvailableSnaps],
  );

  return { fetchResolutions };
}
