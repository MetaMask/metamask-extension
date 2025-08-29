import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import * as utilsModule from '../../../helpers/utils/util';
import * as copyHookModule from '../../../hooks/useCopyToClipboard';
import * as multichainSelectors from '../../../selectors/multichain';
// import * as selectors from '../../../selectors/selectors';
import * as networkSelectors from '../../../../shared/modules/selectors/networks';
import * as blockExplorerUtils from '../../../helpers/utils/multichain/blockExplorer';
import * as explorerMenuItem from '../../multichain/menu-items/view-explorer-menu-item';

import { getInternalAccountByAddress } from '../../../selectors/selectors';
import { AddressQRCodeModal } from './address-qr-code-modal';
// Get the mocked function

// Mock the getInternalAccountByAddress selector before importing the component
jest.mock('../../../selectors/selectors', () => ({
  getInternalAccountByAddress: jest.fn(),
}));

// Mock modules
jest.mock('../../../helpers/utils/util');
jest.mock('../../../hooks/useCopyToClipboard');
jest.mock('../../../selectors/multichain', () => ({
  getImageForChainId: jest.fn(),
}));
// jest.mock('../../../selectors/selectors');
jest.mock('../../../../shared/modules/selectors/networks');
jest.mock('../../../helpers/utils/multichain/blockExplorer');
jest.mock('../../multichain/menu-items/view-explorer-menu-item');
jest.mock('../../../pages/multichain-accounts/account-details');
jest.mock('../../../../shared/modules/selectors/smart-transactions');
jest.mock('../../../../shared/modules/selectors/index');

const mockShortenAddress = jest.mocked(utilsModule.shortenAddress);
const mockUseCopyToClipboard = jest.mocked(copyHookModule.useCopyToClipboard);
const mockGetImageForChainId = jest.mocked(
  multichainSelectors.getImageForChainId,
);
const mockGetInternalAccountByAddress = jest.mocked(
  getInternalAccountByAddress,
);
const mockGetProviderConfig = jest.mocked(networkSelectors.getProviderConfig);
const mockGetMultichainAccountUrl = jest.mocked(
  blockExplorerUtils.getMultichainAccountUrl,
);
const mockOpenBlockExplorer = jest.mocked(explorerMenuItem.openBlockExplorer);

// Mock account type detection
jest.mock('../../../pages/multichain-accounts/account-details', () => ({
  getAccountTypeCategory: jest.fn().mockReturnValue('evm'),
}));

describe('AddressQRCodeModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    address: '0x1234567890123456789012345678901234567890',
    chainId: '0x1',
    account: {
      id: 'test-account',
      address: '0x1234567890123456789012345678901234567890',
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
        keyring: { type: 'HD Key Tree' },
      },
      options: {},
      methods: [],
      type: 'eip155:eoa' as const,
      scopes: ['eip155:1' as `${string}:${string}`],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockShortenAddress.mockReturnValue('0x1234...7890');
    mockUseCopyToClipboard.mockReturnValue([false, jest.fn(), jest.fn()]);
    mockGetImageForChainId.mockReturnValue('/images/ethereum.svg');
    mockGetInternalAccountByAddress.mockReturnValue({
      id: 'test-account',
      address: '0x1234567890123456789012345678901234567890',
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
        keyring: { type: 'HD Key Tree' },
      },
      options: {},
      methods: [],
      type: 'eip155:eoa' as const,
      scopes: ['eip155:1' as `${string}:${string}`],
    });
    mockGetProviderConfig.mockReturnValue({
      chainId: '0x1',
      nickname: 'Ethereum Mainnet',
      ticker: 'ETH',
      type: 'mainnet',
      rpcPrefs: {},
    });
    mockGetMultichainAccountUrl.mockReturnValue(
      'https://etherscan.io/address/0x1234567890123456789012345678901234567890',
    );
    mockOpenBlockExplorer.mockImplementation(() => {});
  });

  it('should render the modal when isOpen is true', () => {
    render(<AddressQRCodeModal {...mockProps} />);

    expect(
      screen.getByText('Test Account / Ethereum Mainnet'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ethereum Mainnet Address')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Use this address to receive tokens and collectibles on Ethereum Mainnet',
      ),
    ).toBeInTheDocument();

    expect(mockGetInternalAccountByAddress).toHaveBeenCalledWith(
      expect.any(Object),
      '0x1234567890123456789012345678901234567890',
    );
    expect(mockGetMultichainNetworkConfigurationsByChainId).toHaveBeenCalled();
  });

  it('should not render the modal when isOpen is false', () => {
    render(<AddressQRCodeModal {...mockProps} isOpen={false} />);

    expect(
      screen.queryByText('Test Account / Ethereum Mainnet'),
    ).not.toBeInTheDocument();
  });

  it('should render the copy button with shortened address', () => {
    render(<AddressQRCodeModal {...mockProps} />);

    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    expect(mockShortenAddress).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
    );
  });

  it('should render the view on explorer button', () => {
    render(<AddressQRCodeModal {...mockProps} />);

    expect(screen.getByText('View address on Etherscan')).toBeInTheDocument();
  });

  it('should handle copy functionality when copy button is clicked', async () => {
    const mockHandleCopy = jest.fn();
    mockUseCopyToClipboard.mockReturnValue([false, mockHandleCopy, jest.fn()]);

    render(<AddressQRCodeModal {...mockProps} />);

    const copyButton = screen.getByText('0x1234...7890');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockHandleCopy).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
      );
    });
  });

  it('should show copy success state when copy is successful', () => {
    mockUseCopyToClipboard.mockReturnValue([true, jest.fn(), jest.fn()]);

    render(<AddressQRCodeModal {...mockProps} />);

    // Check if the copy success icon is rendered (this is harder to test directly,
    // but we can verify the hook state is used correctly)
    expect(mockUseCopyToClipboard).toHaveBeenCalled();
  });

  it('should handle explorer navigation when explorer button is clicked', async () => {
    render(<AddressQRCodeModal {...mockProps} />);

    const explorerButton = screen.getByText('View address on Etherscan');
    fireEvent.click(explorerButton);

    await waitFor(() => {
      expect(mockGetMultichainAccountUrl).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        {
          chainId: '0x1',
          type: 'mainnet',
        },
      );
      expect(mockOpenBlockExplorer).toHaveBeenCalledWith(
        'https://etherscan.io/address/0x1234567890123456789012345678901234567890',
        'Address QR Code Modal',
      );
    });
  });

  it('should render generic explorer text when no account is provided', () => {
    const propsWithoutAccount = {
      ...mockProps,
      account: undefined,
    };

    render(<AddressQRCodeModal {...propsWithoutAccount} />);

    expect(screen.getByText('View on Explorer')).toBeInTheDocument();
  });

  it('should use selectors for account and network data', () => {
    render(<AddressQRCodeModal {...mockProps} />);

    expect(mockGetImageForChainId).toHaveBeenCalledWith('0x1');
    expect(mockGetInternalAccountByAddress).toHaveBeenCalledWith(
      expect.any(Object),
      '0x1234567890123456789012345678901234567890',
    );
    expect(mockGetMultichainNetworkConfigurationsByChainId).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<AddressQRCodeModal {...mockProps} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should generate QR code with the provided address', () => {
    render(<AddressQRCodeModal {...mockProps} />);

    // The QR code generation is handled internally, but we can verify the component renders
    expect(screen.getByText('Ethereum Mainnet Address')).toBeInTheDocument();
  });

  it('should handle different network names dynamically', () => {
    mockGetProviderConfig.mockReturnValue({
      chainId: '0x89',
      nickname: 'Polygon',
      ticker: 'MATIC',
      type: 'custom',
      rpcPrefs: {},
    });

    const polygonProps = {
      ...mockProps,
      chainId: '0x89',
    };

    render(<AddressQRCodeModal {...polygonProps} />);

    expect(screen.getByText('Test Account / Polygon')).toBeInTheDocument();
    expect(screen.getByText('Polygon Address')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Use this address to receive tokens and collectibles on Polygon',
      ),
    ).toBeInTheDocument();
  });
});
