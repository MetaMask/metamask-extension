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

// Mock react-router-dom
const mockPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockPush,
  }),
}));

// Mock redux
const mockDispatch = jest.fn();
const mockUseSelectorImpl = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (...args: unknown[]) => mockUseSelectorImpl(...args),
}));

// Mock the setRedirectAfterDefaultPage action
jest.mock('../../../ducks/history/history', () => ({
  setRedirectAfterDefaultPage: (payload: {
    path: string;
    address: string;
  }) => ({
    type: 'SET_REDIRECT_AFTER_DEFAULT_PAGE',
    payload,
  }),
}));

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
    userIntent?: boolean | null;
    setUserIntent?: (value: boolean | null) => void;
    returnToPage?: string;
  } = {},
) => {
  const store = configureStore({});
  const defaultProps = {
    networkConfig: mockNetworkConfig,
    address: mockAddress,
    userIntent: null,
    setUserIntent: jest.fn(),
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

    // Mock useSelector to return empty array by default
    mockUseSelectorImpl.mockReturnValue([]);
  });

  describe('Basic Rendering', () => {
    it('displays network name and toggle button', () => {
      render();

      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('shows toggle as ON for supported networks', () => {
      render({
        networkConfig: mockNetworkConfig,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass('toggle-button--on');
    });

    it('shows toggle as OFF for unsupported networks', () => {
      render({
        networkConfig: mockUnsupportedNetworkConfig,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--off',
      );
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
      const setUserIntent = jest.fn();
      render({
        networkConfig: mockNetworkConfig,
        setUserIntent,
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(setUserIntent).toHaveBeenCalledWith(false);
      });
      expect(mockDowngradeAccount).toHaveBeenCalledWith(mockAddress);
    });

    it('upgrades account when turning ON unsupported network', async () => {
      const setUserIntent = jest.fn();
      render({
        networkConfig: mockUnsupportedNetworkConfig,
        setUserIntent,
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(setUserIntent).toHaveBeenCalledWith(true);
      });
      expect(mockUpgradeAccount).toHaveBeenCalledWith(
        mockAddress,
        mockUnsupportedNetworkConfig.upgradeContractAddress,
      );
    });

    it('prevents upgrade when contract address is missing', async () => {
      const setUserIntent = jest.fn();
      const networkWithoutUpgradeAddress = {
        ...mockUnsupportedNetworkConfig,
        upgradeContractAddress: undefined,
      };

      render({
        networkConfig: networkWithoutUpgradeAddress,
        setUserIntent,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--disabled',
      );
    });
  });

  describe('Disabled State', () => {
    it('disables toggle during pending requests', () => {
      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      render();

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--disabled',
      );
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

      const setUserIntent = jest.fn();
      render({
        setUserIntent,
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(setUserIntent).not.toHaveBeenCalled();
    });
  });

  describe('User Intent Management', () => {
    it('disables toggle when userIntent is not null', () => {
      render({
        userIntent: true,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--disabled',
      );
    });

    it('uses userIntent as primary source of truth', () => {
      render({
        userIntent: false,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--off',
      );
    });

    it('falls back to actual state when userIntent is null', () => {
      render({
        userIntent: null,
      });

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass('toggle-button--on');
    });
  });

  describe('Error Handling', () => {
    it('resets userIntent when upgradeAccount throws error', async () => {
      const setUserIntent = jest.fn();
      mockUpgradeAccount.mockRejectedValue(new Error('Upgrade failed'));

      render({
        networkConfig: mockUnsupportedNetworkConfig,
        setUserIntent,
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(setUserIntent).toHaveBeenCalledWith(null);
      });
    });

    it('resets userIntent when downgradeAccount throws error', async () => {
      const setUserIntent = jest.fn();
      mockDowngradeAccount.mockRejectedValue(new Error('Downgrade failed'));

      render({
        networkConfig: mockNetworkConfig,
        setUserIntent,
      });

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(setUserIntent).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Transaction Monitoring', () => {
    it('redirects to transaction confirmation when userIntent is set and transaction is found', () => {
      const mockTransactions = [
        {
          id: 'tx-123',
          txParams: { from: mockAddress },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now(),
        },
      ];

      mockUseSelectorImpl.mockReturnValue(mockTransactions);

      render({
        userIntent: true,
      });

      expect(mockPush).toHaveBeenCalledWith('/confirm-transaction/tx-123');
    });

    it('sets redirect after default page when returnToPage is provided', () => {
      const mockTransactions = [
        {
          id: 'tx-123',
          txParams: { from: mockAddress },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now(),
        },
      ];

      mockUseSelectorImpl.mockReturnValue(mockTransactions);

      const returnToPage = '/home';
      render({
        userIntent: true,
        returnToPage,
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_REDIRECT_AFTER_DEFAULT_PAGE',
        payload: { path: returnToPage, address: mockAddress },
      });
    });

    it('finds the latest transaction when multiple transactions exist', () => {
      const mockTransactions = [
        {
          id: 'tx-old',
          txParams: { from: mockAddress },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now() - 1000,
        },
        {
          id: 'tx-new',
          txParams: { from: mockAddress },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now(),
        },
      ];

      mockUseSelectorImpl.mockReturnValue(mockTransactions);

      render({
        userIntent: true,
      });

      expect(mockPush).toHaveBeenCalledWith('/confirm-transaction/tx-new');
    });

    it('does not redirect when no matching transactions are found', () => {
      const mockTransactions = [
        {
          id: 'tx-other',
          txParams: { from: '0xDifferentAddress' },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now(),
        },
      ];

      mockUseSelectorImpl.mockReturnValue(mockTransactions);

      render({
        userIntent: true,
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
