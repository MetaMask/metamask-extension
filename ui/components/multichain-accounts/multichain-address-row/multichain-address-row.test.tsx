import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { KnownCaipNamespace, CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MultichainNetwork } from '../../../selectors/multichain';
import { MultichainAddressRow } from './multichain-address-row';

const mockHandleCopy = jest.fn();

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

// Get the mocked function after the mock is set up
const { useCopyToClipboard: mockUseCopyToClipboard } = require('../../../hooks/useCopyToClipboard');

const mockNetwork: MultichainNetwork = {
  nickname: 'Ethereum Mainnet',
  isEvmNetwork: true,
  chainId: `${KnownCaipNamespace.Eip155}:1` as CaipChainId,
  network: {
    type: 'mainnet',
    chainId: '0x1',
    ticker: 'ETH',
    rpcPrefs: {
      imageUrl: './images/eth_logo.svg',
    },
  },
};

const mockAddress = '0x1234567890123456789012345678901234567890';

const render = (props = {}) => {
  const store = configureStore(mockState);
  return renderWithProvider(
    <MultichainAddressRow network={mockNetwork} address={mockAddress} {...props} />,
    store,
  );
};

describe('MultichainAddressRow', () => {
  beforeEach(() => {
    mockHandleCopy.mockClear();
    mockUseCopyToClipboard.mockClear();
    mockUseCopyToClipboard.mockReturnValue([false, mockHandleCopy]);
  });

  it('renders correctly with all elements', () => {
    render();

    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent('Ethereum Mainnet');

    expect(
      screen.getByTestId('multichain-address-row-address'),
    ).toHaveTextContent('0x12345...67890');

    expect(
      screen.getByTestId('multichain-address-row-copy-button'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('multichain-address-row-qr-button'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('multichain-address-row-network-icon'),
    ).toBeInTheDocument();
  });

  it('handles copy button click', () => {
    render();

    const copyButton = screen.getByTestId('multichain-address-row-copy-button');
    fireEvent.click(copyButton);

    expect(mockHandleCopy).toHaveBeenCalledWith(mockAddress);
  });

  it('renders correctly without network image', () => {
    const networkWithoutImage: MultichainNetwork = {
      nickname: 'Custom Network',
      isEvmNetwork: true,
      chainId: `${KnownCaipNamespace.Eip155}:1337` as CaipChainId,
      network: {
        type: 'rpc',
        chainId: '0x539',
        ticker: 'ETH',
        rpcPrefs: {},
      },
    };

    render({ network: networkWithoutImage });

    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent('Custom Network');
    expect(
      screen.getByTestId('multichain-address-row-network-icon'),
    ).toBeInTheDocument();
  });

  it('shows copy success icon when copied is true', () => {
    mockUseCopyToClipboard.mockReturnValueOnce([true, mockHandleCopy]);

    render();

    const copyButton = screen.getByTestId('multichain-address-row-copy-button');

    expect(copyButton).toBeInTheDocument();
  });

  it('handles networks with different image source', () => {
    const networkWithDifferentImage: MultichainNetwork = {
      nickname: 'Test Network',
      isEvmNetwork: true,
      chainId: `${KnownCaipNamespace.Eip155}:1` as CaipChainId,
      network: {
        type: 'mainnet',
        chainId: '0x1',
        ticker: 'ETH',
        rpcPrefs: {
          imageUrl: './images/test-icon.svg',
        },
      },
    };

    render({ network: networkWithDifferentImage });

    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent('Test Network');
    expect(
      screen.getByTestId('multichain-address-row-network-icon'),
    ).toBeInTheDocument();
  });
});
