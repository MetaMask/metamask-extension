import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { DomainLookupResult } from '@metamask/snaps-sdk';
import { getNameLookupSnapsIds } from '../../selectors';
import { handleSnapRequest } from '../../store/actions';

/**
 * A hook for using Snaps to resolve domain names for a given chain ID.
 *
 * @returns Function to get domain name resolutions.
 */
export function useSnapNameResolution() {
  const snapIds = useSelector(getNameLookupSnapsIds) as string[];

  /**
   * Filters the available snaps based on the provided chain ID and domain.
   *
   * @param chainId - The CAIP-2 chain ID.
   * @param domain - The domain to resolve.
   * @returns The filtered snap IDs.
   */
  const getAvailableSnaps = useCallback(
    (_chainId: string, _domain: string) => snapIds,
    [snapIds],
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
