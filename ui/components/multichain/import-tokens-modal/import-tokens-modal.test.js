import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import configureStore from '../../../store/store';
import { clearPendingTokens } from '../../../store/actions';
import mockState from '../../../../test/data/mock-state.json';
import { ImportTokensModal } from '.';

// Mock the useTokensWithFiltering hook
const mockUseTokensWithFiltering = jest.fn(() => ({
  *filteredTokenListGenerator() {
    // Return empty generator by default
  },
  isLoading: false,
}));

jest.mock('../../../hooks/bridge/useTokensWithFiltering', () => ({
  useTokensWithFiltering: (...args) => mockUseTokensWithFiltering(...args),
}));

jest.mock('../../../store/actions', () => ({
  clearPendingTokens: jest
    .fn()
    .mockImplementation(() => ({ type: 'CLEAR_PENDING_TOKENS' })),
}));

describe('ImportTokensModal', () => {
  const render = (metamaskStateChanges = {}, onClose = jest.fn()) => {
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...metamaskStateChanges,
        tokensChainsCache: {
          [CHAIN_IDS.GOERLI]: {
            timestamp: Date.now(),
            data: {},
          },
        },
      },
    });
    return renderWithProvider(<ImportTokensModal onClose={onClose} />, store);
  };

  afterEach(() => {
    // Reset mock to default empty generator after each test
    mockUseTokensWithFiltering.mockReturnValue({
      *filteredTokenListGenerator() {
        // Empty generator
      },
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  describe('Search', () => {
    it('renders Search tab with token list', () => {
      // Mock useTokensWithFiltering to return a sample token for Goerli
      mockUseTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          yield {
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            symbol: 'UNI',
            name: 'Uniswap',
            decimals: 18,
            image: 'https://example.com/uni.png',
            aggregators: ['CoinGecko'],
            occurrences: 5,
          };
        },
        isLoading: false,
      });

      const { getByText } = render();

      // Search tab should be visible when there are tokens
      expect(getByText('Search')).toBeInTheDocument();
      expect(getByText('Custom token')).toBeInTheDocument();
    });

    it('shows loading state when tokens are loading', () => {
      // Mock useTokensWithFiltering to return loading state
      mockUseTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          // Empty generator
        },
        isLoading: true,
      });

      const { getByText } = render();

      // Loading text should be visible
      expect(getByText(/loading/iu)).toBeInTheDocument();
    });

    it('shows only Custom token tab when no search tokens available', () => {
      // Default mock returns empty generator
      const { getByText, queryByText } = render();

      // Only Custom token tab should be visible
      expect(getByText('Custom token')).toBeInTheDocument();
      expect(queryByText('Search')).not.toBeInTheDocument();
    });

    it('shows token detection banner when useTokenDetection is false', () => {
      mockUseTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          yield {
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            symbol: 'UNI',
            name: 'Uniswap',
            decimals: 18,
            image: 'https://example.com/uni.png',
            aggregators: ['CoinGecko'],
            occurrences: 5,
          };
        },
        isLoading: false,
      });

      const { getByText } = render({ useTokenDetection: false });

      const searchTab = getByText('Search');
      fireEvent.click(searchTab);

      expect(
        getByText(/Enhanced token detection is currently available/iu),
      ).toBeInTheDocument();
    });

    it('does not show token detection banner when useTokenDetection is true', () => {
      mockUseTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          yield {
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            symbol: 'UNI',
            name: 'Uniswap',
            decimals: 18,
            image: 'https://example.com/uni.png',
            aggregators: ['CoinGecko'],
            occurrences: 5,
          };
        },
        isLoading: false,
      });

      const { getByText, queryByText } = render({ useTokenDetection: true });

      const searchTab = getByText('Search');
      fireEvent.click(searchTab);

      expect(
        queryByText(/Enhanced token detection is currently available/iu),
      ).not.toBeInTheDocument();
    });
  });

  describe('Custom Token', () => {
    it('add custom token button is disabled when no fields are populated', () => {
      const { getByText } = render();
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);
      const submit = getByText('Next');

      expect(submit).toBeDisabled();
    });

    it('edits token address', () => {
      const { getByText, getByTestId } = render();
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);

      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      const event = { target: { value: tokenAddress } };
      fireEvent.change(
        getByTestId('import-tokens-modal-custom-address'),
        event,
      );

      expect(
        getByTestId('import-tokens-modal-custom-address').value,
      ).toStrictEqual(tokenAddress);
    });

    it('cancels out of import token flow', () => {
      const onClose = jest.fn();
      render({}, onClose);

      fireEvent.click(document.querySelector('button[aria-label="Close"]'));

      expect(clearPendingTokens).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('shows error for invalid token address', () => {
      const { getByText, getByTestId } = render();
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);

      const invalidAddress = '0xinvalidaddress';
      fireEvent.change(getByTestId('import-tokens-modal-custom-address'), {
        target: { value: invalidAddress },
      });

      // Error appears synchronously for invalid address format
      expect(getByText('Invalid address')).toBeInTheDocument();
      expect(getByText('Next')).toBeDisabled();
    });

    it('does not show error for empty address', () => {
      const { getByText, getByTestId, queryByText } = render();
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);

      const emptyAddress = '';
      fireEvent.change(getByTestId('import-tokens-modal-custom-address'), {
        target: { value: emptyAddress },
      });

      // Empty address should not trigger error
      expect(queryByText('Invalid address')).not.toBeInTheDocument();
      expect(getByText('Next')).toBeDisabled();
    });

    it('can switch between Search and Custom token tabs', () => {
      // Mock useTokensWithFiltering to return a token so Search tab appears
      mockUseTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          yield {
            address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            symbol: 'UNI',
            name: 'Uniswap',
            decimals: 18,
            image: 'https://example.com/uni.png',
            aggregators: ['CoinGecko'],
            occurrences: 5,
          };
        },
        isLoading: false,
      });

      const { getByText } = render();

      const searchTab = getByText('Search');
      const customTokenTab = getByText('Custom token');

      // Click Custom token tab
      fireEvent.click(customTokenTab);
      expect(customTokenTab).toBeInTheDocument();

      // Click Search tab
      fireEvent.click(searchTab);
      expect(searchTab).toBeInTheDocument();
    });
  });

  describe('Network Selection', () => {
    it('opens network selector when clicking select network button', () => {
      const { getByText, getByTestId } = render();

      const networkSelector = getByTestId(
        'test-import-tokens-network-selector',
      );
      fireEvent.click(networkSelector);

      expect(getByText('Select a network')).toBeInTheDocument();
    });

    it('displays current network name', () => {
      const { getByText } = render();

      // Goerli should be displayed as the selected network
      expect(getByText('Goerli')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables Next button when no tokens are selected', () => {
      const { getByText } = render();

      const nextButton = getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Modal Controls', () => {
    it('closes modal when clicking Close button in header', () => {
      const onClose = jest.fn();
      render({}, onClose);

      const closeButton = document.querySelector('button[aria-label="Close"]');
      fireEvent.click(closeButton);

      expect(clearPendingTokens).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('displays Import tokens as modal title', () => {
      const { getByText } = render();

      expect(getByText('Import tokens')).toBeInTheDocument();
    });
  });
});
