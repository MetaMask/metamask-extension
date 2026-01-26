import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { BlockExplorerLink } from './block-explorer-link';

const CHAIN_ID = '0x1';
const TX_HASH = '0xabc123';
const BLOCK_EXPLORER_URL = 'https://etherscan.io';

const mockStore = configureMockStore([]);

const mockState = {
  metamask: {
    networkConfigurationsByChainId: {
      [CHAIN_ID]: {
        chainId: CHAIN_ID,
        name: 'Ethereum Mainnet',
        blockExplorerUrls: [BLOCK_EXPLORER_URL],
        defaultBlockExplorerUrlIndex: 0,
      },
    },
  },
};

describe('BlockExplorerLink', () => {
  const mockOpenTab = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    global.platform = { openTab: mockOpenTab } as never;
  });

  it('renders link when explorer URL and hash are available', () => {
    const { getByTestId } = renderWithProvider(
      <BlockExplorerLink chainId={CHAIN_ID} hash={TX_HASH} />,
      mockStore(mockState),
    );

    expect(getByTestId('block-explorer-link')).toBeInTheDocument();
  });

  it('opens block explorer URL on click', () => {
    const { getByTestId } = renderWithProvider(
      <BlockExplorerLink chainId={CHAIN_ID} hash={TX_HASH} />,
      mockStore(mockState),
    );

    fireEvent.click(getByTestId('block-explorer-link'));

    expect(mockOpenTab).toHaveBeenCalledWith({
      url: `${BLOCK_EXPLORER_URL}/tx/${TX_HASH}`,
    });
  });

  it('returns null when hash is undefined', () => {
    const { container } = renderWithProvider(
      <BlockExplorerLink chainId={CHAIN_ID} hash={undefined} />,
      mockStore(mockState),
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when network configuration is missing', () => {
    const emptyState = {
      metamask: {
        networkConfigurationsByChainId: {},
      },
    };

    const { container } = renderWithProvider(
      <BlockExplorerLink chainId={CHAIN_ID} hash={TX_HASH} />,
      mockStore(emptyState),
    );

    expect(container.firstChild).toBeNull();
  });

  it('uses Hyperliquid explorer URL when isHyperliquid is true', () => {
    const { getByTestId } = renderWithProvider(
      <BlockExplorerLink chainId={CHAIN_ID} hash={TX_HASH} isHyperliquid />,
      mockStore(mockState),
    );

    fireEvent.click(getByTestId('block-explorer-link'));

    expect(mockOpenTab).toHaveBeenCalledWith({
      url: `https://app.hyperliquid.xyz/explorer/tx/${TX_HASH}`,
    });
  });
});
