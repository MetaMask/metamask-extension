import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import * as bridgeControllerModule from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import {
  clearPendingTokens,
  getTokenStandardAndDetailsByChain,
  setPendingTokens,
  setConfirmationExchangeRates,
} from '../../../store/actions';
import mockState from '../../../../test/data/mock-state.json';
import { TokenStandard } from '../../../../shared/constants/transaction';
import * as assetUtilsModule from '../../../../shared/lib/asset-utils';
import { ImportTokensModal } from '.';

jest.mock('../../../hooks/bridge/useTokensWithFiltering');
jest.mock('@metamask/bridge-controller');
jest.mock('../../../../shared/lib/asset-utils');
jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual('../../../selectors/multichain-accounts/account-tree'),
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(() => ({
    id: 'mock-account-id',
    address: '0xMockAddress',
  })),
}));

const {
  useTokensWithFiltering,
} = require('../../../hooks/bridge/useTokensWithFiltering');

jest.mock('../../../store/actions', () => ({
  // Actions used in tests
  getTokenStandardAndDetailsByChain: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ standard: 'ERC20' })),
  setPendingTokens: jest
    .fn()
    .mockImplementation(() => ({ type: 'SET_PENDING_TOKENS' })),
  clearPendingTokens: jest
    .fn()
    .mockImplementation(() => ({ type: 'CLEAR_PENDING_TOKENS' })),
  setConfirmationExchangeRates: jest
    .fn()
    .mockImplementation(() => ({ type: 'SET_CONFIRMATION_EXCHANGE_RATES' })),
}));

describe('ImportTokensModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useTokensWithFiltering.mockReturnValue({
      *filteredTokenListGenerator() {
        yield {
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
          image: 'http://example.com/dai.png',
        };
      },
      isLoading: false,
    });

    jest
      .spyOn(assetUtilsModule, 'isEvmChainId')
      .mockImplementation((chainId) => {
        if (!chainId) {
          return false;
        }
        return chainId.startsWith('0x') || chainId.startsWith('eip155:');
      });

    jest
      .spyOn(bridgeControllerModule, 'formatChainIdToHex')
      .mockImplementation((chainId) => {
        if (chainId?.startsWith('eip155:')) {
          return `0x${parseInt(chainId.split(':')[1], 10).toString(16)}`;
        }
        return chainId;
      });
  });

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

  describe('Search', () => {
    it('renders expected elements', () => {
      const { getByText, getByPlaceholderText } = render();
      expect(getByText('Next')).toBeDisabled();
      expect(getByPlaceholderText('Search tokens')).toBeInTheDocument();
    });

    it('shows the token detection notice when setting is off', () => {
      const { getByText } = render({ useTokenDetection: false });
      expect(getByText('Enable it from Settings.')).toBeInTheDocument();
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

    it('edits token symbol', async () => {
      const { getByText, getByTestId } = render();
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);

      // Enter token address first
      const tokenAddress = '0xB7b78f0Caa05C4743b231ACa619f60124FEA4261';
      const eventTokenAddress = { target: { value: tokenAddress } };
      fireEvent.change(
        getByTestId('import-tokens-modal-custom-address'),
        eventTokenAddress,
      );

      expect(
        getByTestId('import-tokens-modal-custom-address').value,
      ).toStrictEqual(tokenAddress);

      // wait for the symbol input to be in the document
      await waitFor(() =>
        expect(
          getByTestId('import-tokens-modal-custom-symbol'),
        ).toBeInTheDocument(),
      );

      const tokenSymbol = 'META';
      const event = { target: { value: tokenSymbol } };
      fireEvent.change(getByTestId('import-tokens-modal-custom-symbol'), event);

      expect(
        getByTestId('import-tokens-modal-custom-symbol').value,
      ).toStrictEqual(tokenSymbol);
    });

    it('edits token decimal precision', async () => {
      const { getByText, getByTestId } = render();
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);

      // Enter token address first
      const tokenAddress = '0xB7b78f0Caa05C4743b231ACa619f60124FEA4261';
      const eventTokenAddress = { target: { value: tokenAddress } };
      fireEvent.change(
        getByTestId('import-tokens-modal-custom-address'),
        eventTokenAddress,
      );

      // wait for the decimals input to be in the document
      await waitFor(() =>
        expect(
          getByTestId('import-tokens-modal-custom-decimals'),
        ).toBeInTheDocument(),
      );

      const tokenPrecision = '2';
      const event = { target: { value: tokenPrecision } };
      fireEvent.change(
        getByTestId('import-tokens-modal-custom-decimals'),
        event,
      );

      expect(
        getByTestId('import-tokens-modal-custom-decimals').value,
      ).toStrictEqual(tokenPrecision);
    });

    it('adds custom tokens successfully', async () => {
      const { getByText, getByTestId } = render({ tokens: [], tokenList: {} });
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);

      expect(getByText('Next')).toBeDisabled();

      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      await fireEvent.change(
        getByTestId('import-tokens-modal-custom-address'),
        {
          target: { value: tokenAddress },
        },
      );
      expect(getByText('Next')).not.toBeDisabled();

      // wait for the symbol input to be in the document
      await waitFor(() =>
        expect(
          getByTestId('import-tokens-modal-custom-symbol'),
        ).toBeInTheDocument(),
      );

      const tokenSymbol = 'META';

      fireEvent.change(getByTestId('import-tokens-modal-custom-symbol'), {
        target: { value: tokenSymbol },
      });

      expect(getByTestId('import-tokens-modal-custom-symbol').value).toBe(
        'META',
      );

      const tokenPrecision = '2';

      fireEvent.change(getByTestId('import-tokens-modal-custom-decimals'), {
        target: { value: tokenPrecision },
      });

      expect(getByText('Next')).not.toBeDisabled();

      act(() => {
        fireEvent.click(getByText('Next'));
      });

      await waitFor(() => {
        expect(setPendingTokens).toHaveBeenCalledWith({
          customToken: {
            address: tokenAddress,
            chainId: CHAIN_IDS.GOERLI,
            decimals: Number(tokenPrecision),
            standard: TokenStandard.ERC20,
            symbol: tokenSymbol,
            name: '',
          },
          selectedTokens: {},
          tokenAddressList: ['0x6b175474e89094c44da98b954eedeac495271d0f'],
        });

        expect(setConfirmationExchangeRates).toHaveBeenCalled();

        expect(getByText('Import')).toBeInTheDocument();
      });
    });

    it('cancels out of import token flow', () => {
      const onClose = jest.fn();
      render({}, onClose);

      fireEvent.click(document.querySelector('button[aria-label="Close"]'));

      expect(clearPendingTokens).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('sets and error when a token is an NFT', async () => {
      getTokenStandardAndDetailsByChain.mockImplementation(() =>
        Promise.resolve({ standard: TokenStandard.ERC721 }),
      );

      const { getByText, getByTestId } = render();
      const customTokenButton = getByText('Custom token');
      fireEvent.click(customTokenButton);

      const submit = getByText('Next');
      expect(submit).toBeDisabled();

      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      await fireEvent.change(
        getByTestId('import-tokens-modal-custom-address'),
        {
          target: { value: tokenAddress },
        },
      );

      expect(submit).toBeDisabled();

      // The last part of this error message won't be found by getByText because it is wrapped as a link.
      const errorMessage = getByText('This token is an NFT. Add on the');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Conditional UI states based on network and loading', () => {
    it('should show loading indicator when tokens are being fetched', () => {
      useTokensWithFiltering.mockReturnValue({
        filteredTokenListGenerator: null,
        isLoading: true,
      });

      const { getByTestId, queryByPlaceholderText } = render();

      expect(getByTestId('import-tokens-loading')).toBeInTheDocument();
      expect(getByTestId('import-tokens-loading').textContent).toContain(
        'Loading',
      );

      // Should not show search or tabs while loading
      expect(queryByPlaceholderText('Search tokens')).not.toBeInTheDocument();
    });

    it('should show "unavailable" message when no tokens and not EVM chain', () => {
      // Mock as non-EVM chain with no token support
      jest.spyOn(assetUtilsModule, 'isEvmChainId').mockReturnValue(false);

      useTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          // No tokens
        },
        isLoading: false,
      });

      const { getByTestId, queryByText } = render();

      expect(getByTestId('import-tokens-no-support')).toBeInTheDocument();
      expect(getByTestId('import-tokens-no-support').textContent).toContain(
        'Unavailable',
      );

      // Should not show tabs when not supported
      expect(queryByText('Search')).not.toBeInTheDocument();
      expect(queryByText('Custom token')).not.toBeInTheDocument();
    });

    it('should show Search tab when tokens are available on EVM chain', () => {
      jest.spyOn(assetUtilsModule, 'isEvmChainId').mockReturnValue(true);

      useTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          yield {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            decimals: 18,
            image: 'http://example.com/dai.png',
          };
        },
        isLoading: false,
      });

      const { getByText, queryByTestId } = render();

      // Should show tabs
      expect(getByText('Search')).toBeInTheDocument();
      expect(getByText('Custom token')).toBeInTheDocument();

      // Should not show loading or no-support
      expect(queryByTestId('import-tokens-loading')).not.toBeInTheDocument();
      expect(queryByTestId('import-tokens-no-support')).not.toBeInTheDocument();
    });

    it('should show Custom token tab on EVM chain even without token data', () => {
      jest.spyOn(assetUtilsModule, 'isEvmChainId').mockReturnValue(true);

      useTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          // No tokens from search
        },
        isLoading: false,
      });

      const { getByText, queryByText } = render();

      // Custom token tab should still be available on EVM chains
      expect(getByText('Custom token')).toBeInTheDocument();

      // Search tab should not show when no tokens
      expect(queryByText('Search')).not.toBeInTheDocument();
    });

    it('should disable Next button when loading', () => {
      useTokensWithFiltering.mockReturnValue({
        filteredTokenListGenerator: null,
        isLoading: true,
      });

      const { getByTestId } = render();

      expect(getByTestId('import-tokens-button-next')).toBeDisabled();
    });

    it('should disable Next button when showing no support placeholder', () => {
      jest.spyOn(assetUtilsModule, 'isEvmChainId').mockReturnValue(false);

      useTokensWithFiltering.mockReturnValue({
        *filteredTokenListGenerator() {
          // No tokens
        },
        isLoading: false,
      });

      const { getByTestId } = render();

      expect(getByTestId('import-tokens-button-next')).toBeDisabled();
    });
  });
});
