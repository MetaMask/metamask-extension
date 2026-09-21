import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
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
        addProperties: jest.fn().mockReturnValue({ build: jest.fn() }),
      }),
    }),
  }),
}));

jest.mock('./asset-page', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ optionsButton }: { optionsButton: React.ReactNode }) => (
    <div data-testid="asset-page">{optionsButton}</div>
  ),
}));

const MAINNET_CHAIN_ID = CHAIN_IDS.MAINNET;

const ethToken = {
  symbol: 'ETH',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
};

describe('NativeAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectNetworkConfigurationByChainId.mockReturnValue({
      blockExplorerUrls: ['https://etherscan.io'],
      defaultBlockExplorerUrlIndex: 0,
    } as unknown as NetworkConfiguration);
  });

  it('fetches network config for the asset chainId', () => {
    renderWithProvider(
      <NativeAsset token={ethToken} chainId={MAINNET_CHAIN_ID} />,
      configureMockStore()(mockState),
    );

    expect(mockSelectNetworkConfigurationByChainId).toHaveBeenCalledWith(
      expect.anything(),
      MAINNET_CHAIN_ID,
    );
  });

  it('uses the configured block explorer URL in the link', async () => {
    mockSelectNetworkConfigurationByChainId.mockReturnValue({
      blockExplorerUrls: ['https://custom-explorer.example.com'],
      defaultBlockExplorerUrlIndex: 0,
    } as unknown as NetworkConfiguration);

    renderWithProvider(
      <NativeAsset token={ethToken} chainId={MAINNET_CHAIN_ID} />,
      configureMockStore()(mockState),
    );

    fireEvent.click(screen.getByTestId('asset-options__button'));
    await screen.findByTestId('asset-options__etherscan');
    fireEvent.click(screen.getByTestId('asset-options__etherscan'));

    expect(mockOpenTab).toHaveBeenCalledWith({
      url: expect.stringContaining('custom-explorer.example.com'),
    });
  });
});
