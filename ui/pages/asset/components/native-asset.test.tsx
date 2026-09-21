import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import type { Hex } from '@metamask/utils';
import type { NetworkConfiguration } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { selectNetworkConfigurationByChainId } from '../../../../shared/lib/selectors/networks';
import NativeAsset from './native-asset';

jest.mock('../../../../shared/lib/selectors/networks', () => ({
  ...jest.requireActual('../../../../shared/lib/selectors/networks'),
  selectNetworkConfigurationByChainId: jest.fn(),
}));

const mockSelectNetworkConfigurationByChainId = jest.mocked(
  selectNetworkConfigurationByChainId,
);

const mockOpenTab = jest.fn();
global.platform = {
  openTab: mockOpenTab,
} as unknown as typeof global.platform;

jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn().mockReturnValue({
      addCategory: jest.fn().mockReturnValue({
        addProperties: jest.fn().mockReturnValue({
          build: jest.fn(),
        }),
      }),
    }),
  }),
}));

jest.mock('./asset-page', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    optionsButton,
  }: {
    optionsButton: React.ReactNode;
    asset: unknown;
  }) => <div data-testid="asset-page">{optionsButton}</div>,
}));

const MAINNET_CHAIN_ID = CHAIN_IDS.MAINNET;
const CUSTOM_CHAIN_ID = '0x539' as Hex;

const ethToken = {
  symbol: 'ETH',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
};

function createNetworkConfig({
  chainId,
  blockExplorerUrl,
}: {
  chainId: Hex;
  blockExplorerUrl?: string;
}): NetworkConfiguration {
  return {
    chainId,
    name: chainId === MAINNET_CHAIN_ID ? 'Ethereum Mainnet' : 'Custom Network',
    nativeCurrency: chainId === MAINNET_CHAIN_ID ? 'ETH' : 'TEST',
    rpcEndpoints: [
      {
        networkClientId: `network-${chainId}`,
        type: 'custom',
        url: `https://rpc.example.com/${chainId}`,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: blockExplorerUrl
      ? ([blockExplorerUrl] as `https://${string}`[])
      : [],
    defaultBlockExplorerUrlIndex: blockExplorerUrl ? 0 : undefined,
  } as NetworkConfiguration;
}

describe('NativeAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('block explorer link', () => {
    it('uses the block explorer configured for the asset chain', async () => {
      mockSelectNetworkConfigurationByChainId.mockImplementation(
        (_state, chainId) => {
          if (chainId === MAINNET_CHAIN_ID) {
            return createNetworkConfig({
              chainId: MAINNET_CHAIN_ID,
              blockExplorerUrl: 'https://etherscan.io',
            });
          }
          return createNetworkConfig({
            chainId: CUSTOM_CHAIN_ID,
            blockExplorerUrl: 'https://custom-explorer.example.com',
          });
        },
      );

      const store = configureMockStore()(mockState);
      renderWithProvider(
        <NativeAsset token={ethToken} chainId={MAINNET_CHAIN_ID} />,
        store,
      );

      fireEvent.click(screen.getByTestId('asset-options__button'));
      await screen.findByTestId('asset-options__etherscan');
      fireEvent.click(screen.getByTestId('asset-options__etherscan'));

      expect(mockSelectNetworkConfigurationByChainId).toHaveBeenCalledWith(
        expect.anything(),
        MAINNET_CHAIN_ID,
      );
      expect(mockOpenTab).toHaveBeenCalledWith({
        url: expect.stringContaining('etherscan.io'),
      });
    });

    it('falls back to default explorer when no block explorer is configured', async () => {
      mockSelectNetworkConfigurationByChainId.mockReturnValue(
        createNetworkConfig({
          chainId: MAINNET_CHAIN_ID,
          blockExplorerUrl: undefined,
        }),
      );

      const store = configureMockStore()(mockState);
      renderWithProvider(
        <NativeAsset token={ethToken} chainId={MAINNET_CHAIN_ID} />,
        store,
      );

      fireEvent.click(screen.getByTestId('asset-options__button'));
      await screen.findByTestId('asset-options__etherscan');
      fireEvent.click(screen.getByTestId('asset-options__etherscan'));

      expect(mockOpenTab).toHaveBeenCalledWith({
        url: expect.stringContaining('etherscan.io'),
      });
    });
  });
});
