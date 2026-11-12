import '../../../test/jest/strict-mode';

import { waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import * as assetUtils from '../../../shared/lib/asset-utils';
import { mockNetworkState } from '../../../test/stub/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { getToToken } from '../../ducks/bridge/selectors';
import { usePrefillFromSearchQuery } from './usePrefillFromSearchQuery';

const DAI_ASSET_ID =
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f';

const usePrefillWithLocation = () => {
  const location = useLocation();
  usePrefillFromSearchQuery();
  return { location };
};

const createDeferredMetadataFetch = () =>
  jest
    .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
    .mockImplementation((assetIds, signal) => {
      const [toAssetId] = assetIds;

      return new Promise<
        Awaited<ReturnType<typeof assetUtils.fetchAssetMetadataForAssetIds>>
      >((resolve, reject) => {
        if (!toAssetId) {
          resolve(null);
          return;
        }

        const timeout = setTimeout(() => {
          resolve({
            [toAssetId]: {
              assetId: toAssetId,
              symbol: 'DAI',
              name: 'Dai Stablecoin',
              decimals: 18,
            },
          });
        }, 10);

        signal?.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('aborted'));
        });
      });
    });

describe('usePrefillFromSearchQuery under StrictMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies the destination token after the setup/cleanup/setup probe', async () => {
    const fetchSpy = createDeferredMetadataFetch();

    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            {
              chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET),
            },
          ],
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      },
    });

    const { store } = renderHookWithProvider(
      usePrefillWithLocation,
      mockStoreState,
      `/?${new URLSearchParams({ to: DAI_ASSET_ID }).toString()}`,
    );

    await waitFor(() => {
      expect(
        getToToken(store.getState() as never)?.assetId?.toLowerCase(),
      ).toBe(DAI_ASSET_ID);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
