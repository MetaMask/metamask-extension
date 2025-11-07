import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { useEIP7702Account } from '../../../pages/confirmations/hooks/useEIP7702Account';
import { useBatchAuthorizationRequests } from '../../../pages/confirmations/hooks/useBatchAuthorizationRequests';
import { EIP7702NetworkConfiguration } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import { setToggleState } from '../../../ducks/smart-accounts/smart-accounts';
import { SmartContractAccountToggle } from './smart-contract-account-toggle';

jest.mock('../../../pages/confirmations/hooks/useEIP7702Account');
jest.mock('../../../pages/confirmations/hooks/useBatchAuthorizationRequests');

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockDispatch = jest.fn();
const mockUseSelectorImpl = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (...args: unknown[]) => mockUseSelectorImpl(...args),
}));

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
    returnToPage?: string;
  } = {},
  toggleState: boolean | null = null,
  transactions: {
    id: string;
    txParams: { from: string };
    chainId: string;
    time: number;
  }[] = [],
) => {
  const store = configureStore({});
  const defaultProps = {
    networkConfig: mockNetworkConfig,
    address: mockAddress,
    ...props,
  };

  // Mock useSelector to return values in the order they're called
  mockUseSelectorImpl
    .mockReturnValueOnce(transactions) // First call: unconfirmedTransactionsListSelector
    .mockReturnValueOnce(toggleState); // Second call: selectToggleState

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

    it('shows toggle as enabled for supported networks', () => {
      const { container } = render();

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).not.toHaveClass(
        'toggle-button--disabled',
      );
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
    it('upgrades account when turning ON supported network', async () => {
      render({}, false);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          setToggleState({
            address: mockAddress,
            chainId: mockNetworkConfig.chainIdHex,
            value: true,
          }),
        );
      });
      expect(mockUpgradeAccount).toHaveBeenCalledWith(
        mockAddress,
        mockNetworkConfig.upgradeContractAddress,
      );
    });

    it('downgrades account when turning OFF supported network', async () => {
      render({}, true);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          setToggleState({
            address: mockAddress,
            chainId: mockNetworkConfig.chainIdHex,
            value: false,
          }),
        );
      });
      expect(mockDowngradeAccount).toHaveBeenCalledWith(mockAddress);
    });

    it('prevents upgrade when contract address is missing', async () => {
      const networkWithoutUpgradeAddress = {
        ...mockNetworkConfig,
        upgradeContractAddress: undefined,
      };

      render(
        {
          networkConfig: networkWithoutUpgradeAddress,
        },
        false,
      );

      const toggle = screen.getByRole('checkbox');
      expect(toggle.closest('.toggle-button')).toHaveClass(
        'toggle-button--off',
      );
    });
  });

  describe('Disabled State', () => {
    it('disables toggle during pending requests', () => {
      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      const { container } = render({}, true);

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

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('resets toggleState when upgradeAccount throws error', async () => {
      mockUpgradeAccount.mockRejectedValue(new Error('Upgrade failed'));

      render({}, false);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      // Should dispatch the intent first
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          setToggleState({
            address: mockAddress,
            chainId: mockNetworkConfig.chainIdHex,
            value: true,
          }),
        );
      });

      // Then reset after error
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          setToggleState({
            address: mockAddress,
            chainId: mockNetworkConfig.chainIdHex,
            value: null,
          }),
        );
      });
    });

    it('resets toggleState when downgradeAccount throws error', async () => {
      mockDowngradeAccount.mockRejectedValue(new Error('Downgrade failed'));

      render({}, true);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      // Should dispatch the intent first
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          setToggleState({
            address: mockAddress,
            chainId: mockNetworkConfig.chainIdHex,
            value: false,
          }),
        );
      });

      // Then reset after error
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          setToggleState({
            address: mockAddress,
            chainId: mockNetworkConfig.chainIdHex,
            value: null,
          }),
        );
      });
    });
  });

  describe('Transaction Monitoring', () => {
    it('redirects to transaction confirmation when toggleState is set and transaction is found', () => {
      const mockTransactions = [
        {
          id: 'tx-123',
          txParams: { from: mockAddress },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now(),
        },
      ];

      // Set hasPendingRequests to true to trigger the transaction monitoring useEffect
      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      render({}, true, mockTransactions); // toggleState = true

      expect(mockUseNavigate).toHaveBeenCalledWith(
        '/confirm-transaction/tx-123',
      );
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

      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      const returnToPage = '/home';
      render(
        {
          returnToPage,
        },
        true,
        mockTransactions,
      );

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_REDIRECT_AFTER_DEFAULT_PAGE',
        payload: { path: returnToPage, address: mockAddress },
      });
    });

    it('includes address in path when returning to account details', () => {
      const mockTransactions = [
        {
          id: 'tx-123',
          txParams: { from: mockAddress },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now(),
        },
      ];

      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      const returnToPage = '/account-details';
      render(
        {
          returnToPage,
        },
        true,
        mockTransactions,
      );

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_REDIRECT_AFTER_DEFAULT_PAGE',
        payload: {
          path: `${returnToPage}/${mockAddress}`,
          address: mockAddress,
        },
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

      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      render({}, true, mockTransactions);

      expect(mockUseNavigate).toHaveBeenCalledWith(
        '/confirm-transaction/tx-new',
      );
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

      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      render({}, true, mockTransactions);

      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('resets toggleState after timeout when no transaction is found', async () => {
      jest.useFakeTimers();

      mockUseBatchAuthorizationRequests.mockReturnValue({
        hasPendingRequests: true,
      });

      const mockTransactions = [
        {
          id: 'tx-other',
          txParams: { from: '0xDifferentAddress' },
          chainId: mockNetworkConfig.chainIdHex,
          time: Date.now(),
        },
      ];

      render({}, true, mockTransactions);

      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          setToggleState({
            address: mockAddress,
            chainId: mockNetworkConfig.chainIdHex,
            value: null,
          }),
        );
      });

      jest.useRealTimers();
    });
  });
});
