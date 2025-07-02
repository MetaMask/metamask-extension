import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { useEIP7702Account } from '../../../pages/confirmations/hooks/useEIP7702Account';
import { useBatchAuthorizationRequests } from '../../../pages/confirmations/hooks/useBatchAuthorizationRequests';
import { EIP7702NetworkConfiguration } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import { SmartContractAccountToggle } from './smart-contract-account-toggle';

// Mock the hooks
jest.mock('../../../pages/confirmations/hooks/useEIP7702Account');
jest.mock('../../../pages/confirmations/hooks/useBatchAuthorizationRequests');

const mockUseEIP7702Account = useEIP7702Account as jest.MockedFunction<
  typeof useEIP7702Account
>;
const mockUseBatchAuthorizationRequests =
  useBatchAuthorizationRequests as jest.MockedFunction<
    typeof useBatchAuthorizationRequests
  >;

const mockDowngradeAccount = jest.fn();
const mockUpgradeAccount = jest.fn();
const mockIsUpgraded = jest.fn();

const mockNetworkConfig: EIP7702NetworkConfiguration = {
  chainId: 'eip155:1' as const,
  chainIdHex: '0x1' as Hex,
  name: 'Ethereum Mainnet',
  isSupported: true,
  upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B' as Hex,
  nativeCurrency: 'ETH',
  blockExplorerUrls: ['https://etherscan.io'],
  defaultBlockExplorerUrlIndex: 0,
  isEvm: true,
};

const mockUnsupportedNetworkConfig: EIP7702NetworkConfiguration = {
  ...mockNetworkConfig,
  chainIdHex: '0xaa36a7' as Hex,
  name: 'Sepolia',
  isSupported: false,
};

const mockAddress = '0x742d35Cc6634C0532925a3b8D4E8f3c9B26e6e6e' as Hex;

const render = (
  props: {
    networkConfig?: EIP7702NetworkConfiguration;
    address?: Hex;
  } = {},
) => {
  const store = configureStore({});
  const defaultProps = {
    networkConfig: mockNetworkConfig,
    address: mockAddress,
    ...props,
  };
  return renderWithProvider(
    <SmartContractAccountToggle {...defaultProps} />,
    store,
  );
};

describe('SmartContractAccountToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseEIP7702Account.mockReturnValue({
      isUpgraded: mockIsUpgraded,
      downgradeAccount: mockDowngradeAccount,
      upgradeAccount: mockUpgradeAccount,
    });

    mockUseBatchAuthorizationRequests.mockReturnValue({
      hasPendingRequests: false,
    });
  });

  describe('Basic Rendering', () => {
    it('displays network name and toggle button', () => {
      render();

      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('shows toggle as ON for supported networks', () => {
      const { container } = render({
        networkConfig: mockNetworkConfig,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass('toggle-button--on');
      expect(container).toMatchSnapshot();
    });

    it('shows toggle as OFF for unsupported networks', () => {
      const { container } = render({
        networkConfig: mockUnsupportedNetworkConfig,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--off',
      );
      expect(container).toMatchSnapshot();
    });

    it('displays different network names correctly', () => {
      render({
        networkConfig: mockUnsupportedNetworkConfig,
      });

      expect(screen.getByText('Sepolia')).toBeInTheDocument();
    });
  });

  describe('Toggle Actions', () => {
    it('downgrades account when turning OFF supported network', async () => {
      render({
        networkConfig: mockNetworkConfig, // isSupported: true
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockDowngradeAccount).toHaveBeenCalledWith(mockAddress);
      });
      expect(mockUpgradeAccount).not.toHaveBeenCalled();
    });

    it('upgrades account when turning ON unsupported network', async () => {
      render({
        networkConfig: mockUnsupportedNetworkConfig, // isSupported: false
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpgradeAccount).toHaveBeenCalledWith(
          mockAddress,
          mockUnsupportedNetworkConfig.upgradeContractAddress,
        );
      });
      expect(mockDowngradeAccount).not.toHaveBeenCalled();
    });

    it('prevents upgrade when contract address is missing', async () => {
      const networkWithoutUpgradeAddress = {
        ...mockUnsupportedNetworkConfig,
        upgradeContractAddress: undefined,
      };

      render({
        networkConfig: networkWithoutUpgradeAddress,
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpgradeAccount).not.toHaveBeenCalled();
        expect(mockDowngradeAccount).not.toHaveBeenCalled();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables toggle during pending requests', () => {
      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      const { container } = render();

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--disabled',
      );
      expect(container).toMatchSnapshot();
    });

    it('enables toggle when no requests pending', () => {
      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: false,
      });

      render();

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).not.toHaveClass(
        'toggle-button--disabled',
      );
    });

    it('prevents actions when disabled', () => {
      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      render();

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(mockDowngradeAccount).not.toHaveBeenCalled();
      expect(mockUpgradeAccount).not.toHaveBeenCalled();
    });
  });

  describe('State Changes', () => {
    it('reflects network support status correctly', () => {
      // Test with supported network
      const { rerender } = render({
        networkConfig: mockNetworkConfig, // isSupported: true
      });

      let toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass('toggle-button--on');

      // Test with unsupported network
      rerender(
        <SmartContractAccountToggle
          networkConfig={mockUnsupportedNetworkConfig} // isSupported: false
          address={mockAddress}
        />,
      );

      toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--off',
      );
    });
  });
});
