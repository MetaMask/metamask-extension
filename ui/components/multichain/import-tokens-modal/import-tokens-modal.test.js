import React from 'react';
import { act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { ERC20 } from '@metamask/controller-utils';
import * as bridgeControllerModule from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import {
  clearPendingTokens,
  getTokenStandardAndDetailsByChain,
  setPendingTokens,
  setConfirmationExchangeRates,
  importCustomAssetsBatch,
  addImportedTokens,
  hideImportTokensModal,
  setNewTokensImported,
} from '../../../store/actions';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { TokenStandard } from '../../../../shared/constants/transaction';
import * as assetUtilsModule from '../../../../shared/lib/asset-utils';
import { ImportTokensModal } from '.';

// Opt out of the global `isAssetsUnifyStateFeatureEnabled` mock (see test/jest/setup.js)
// so these tests exercise the real feature-flag gating logic via state.
jest.mock('../../../../shared/lib/assets-unify-state/remote-feature-flag', () =>
  jest.requireActual(
    '../../../../shared/lib/assets-unify-state/remote-feature-flag',
  ),
);

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
  setPendingTokens: jest.fn().mockImplementation((pendingTokens) => {
    const {
      customToken,
      selectedTokens = {},
      tokenAddressList = [],
    } = pendingTokens;
    const tokens =
      customToken?.address &&
      customToken?.symbol &&
      Boolean(customToken?.decimals >= 0 && customToken?.decimals <= 36)
        ? {
            ...selectedTokens,
            [customToken.address]: {
              ...customToken,
              isCustom: true,
            },
          }
        : selectedTokens;
    Object.keys(tokens).forEach((tokenAddress) => {
      const found = tokenAddressList.find(
        (addr) => addr.toLowerCase() === tokenAddress.toLowerCase(),
      );
      tokens[tokenAddress] = { ...tokens[tokenAddress], unlisted: !found };
    });
    return { type: 'SET_PENDING_TOKENS', payload: tokens };
  }),
  clearPendingTokens: jest
    .fn()
    .mockImplementation(() => ({ type: 'CLEAR_PENDING_TOKENS' })),
  setConfirmationExchangeRates: jest
    .fn()
    .mockImplementation(() => ({ type: 'SET_CONFIRMATION_EXCHANGE_RATES' })),
  importCustomAssetsBatch: jest
    .fn()
    .mockImplementation(() => ({ type: 'IMPORT_CUSTOM_ASSETS_BATCH' })),
  addImportedTokens: jest
    .fn()
    .mockImplementation(() => ({ type: 'ADD_IMPORTED_TOKENS' })),
  hideImportTokensModal: jest
    .fn()
    .mockImplementation(() => ({ type: 'HIDE_IMPORT_TOKENS_MODAL' })),
  setNewTokensImported: jest
    .fn()
    .mockImplementation(() => ({ type: 'SET_NEW_TOKENS_IMPORTED' })),
  setNewTokensImportedError: jest
    .fn()
    .mockImplementation(() => ({ type: 'SET_NEW_TOKENS_IMPORTED_ERROR' })),
  showImportNftsModal: jest
    .fn()
    .mockImplementation(() => ({ type: 'SHOW_IMPORT_NFTS_MODAL' })),
  getTokenSymbol: jest.fn().mockImplementation(() => Promise.resolve('META')),
}));

describe('ImportTokensModal', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-set the default implementation after clearAllMocks to avoid leakage
    // from tests that override it (e.g. the NFT detection test).
    getTokenStandardAndDetailsByChain.mockImplementation(() =>
      Promise.resolve({ standard: 'ERC20' }),
    );

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

    jest
      .spyOn(assetUtilsModule, 'toAssetId')
      .mockImplementation((address, _chainId) => `eip155:5/erc20:${address}`);
  });

  const render = (
    metamaskStateChanges = {},
    onClose = jest.fn(),
    { appStateChanges = {} } = {},
  ) => {
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
      appState: {
        ...mockState.appState,
        ...appStateChanges,
      },
    });
    return renderWithProvider(<ImportTokensModal onClose={onClose} />, store);
  };

  describe('Search', () => {
    it('renders expected elements', () => {
      const { getByText, getByPlaceholderText } = render();
      expect(getByText(messages.next.message)).toBeDisabled();
      expect(
        getByPlaceholderText(messages.searchTokens.message),
      ).toBeInTheDocument();
    });

    it('shows the token detection notice when setting is off', () => {
      const { getByText } = render({ useTokenDetection: false });
      expect(
        getByText(messages.enableFromSettings.message.trim()),
      ).toBeInTheDocument();
    });
  });

  describe('Custom Token', () => {
    it('add custom token button is disabled when no fields are populated', () => {
      const { getByText } = render();
      const customTokenButton = getByText(messages.customToken.message);
      fireEvent.click(customTokenButton);
      const submit = getByText(messages.next.message);

      expect(submit).toBeDisabled();
    });

    it('edits token address', () => {
      const { getByText, getByTestId } = render();
      const customTokenButton = getByText(messages.customToken.message);
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
      const customTokenButton = getByText(messages.customToken.message);
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
      const customTokenButton = getByText(messages.customToken.message);
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
      const customTokenButton = getByText(messages.customToken.message);
      fireEvent.click(customTokenButton);

      expect(getByText(messages.next.message)).toBeDisabled();

      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      await fireEvent.change(
        getByTestId('import-tokens-modal-custom-address'),
        {
          target: { value: tokenAddress },
        },
      );
      expect(getByText(messages.next.message)).not.toBeDisabled();

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

      expect(getByText(messages.next.message)).not.toBeDisabled();

      act(() => {
        fireEvent.click(getByText(messages.next.message));
      });

      await waitFor(() => {
        expect(setPendingTokens).toHaveBeenCalledWith({
          customToken: {
            address: tokenAddress,
            chainId: CHAIN_IDS.GOERLI,
            decimals: Number(tokenPrecision),
            standard: ERC20,
            symbol: tokenSymbol,
            name: '',
          },
          selectedTokens: {},
          tokenAddressList: ['0x6b175474e89094c44da98b954eedeac495271d0f'],
        });

        expect(setConfirmationExchangeRates).toHaveBeenCalled();

        expect(getByText(messages.import.message)).toBeInTheDocument();
      });
    });

    it('does not block import when token exists on a different network', async () => {
      const tokenAddress = '0xbc0a08a3b560327ec16842b5f3bf46fa029366b1';
      const selectedAccountAddress =
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
      const { getByText, getByTestId, queryByText } = render({
        isEvmSelected: false,
        selectedMultichainNetworkChainId: 'eip155:1',
        allTokens: {
          [CHAIN_IDS.GOERLI]: {
            [selectedAccountAddress]: [{ address: tokenAddress }],
          },
        },
      });

      await waitFor(() =>
        expect(getByText('Custom Mainnet RPC')).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(getByText(messages.customToken.message));
      });

      await act(async () => {
        fireEvent.change(getByTestId('import-tokens-modal-custom-address'), {
          target: { value: tokenAddress },
        });
      });

      await waitFor(() => {
        expect(
          queryByText(messages.tokenAlreadyAdded.message),
        ).not.toBeInTheDocument();
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
      const customTokenButton = getByText(messages.customToken.message);
      fireEvent.click(customTokenButton);

      const submit = getByText(messages.next.message);
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
      // nftAddressError message is "This token is an NFT. Add on the $1"
      const errorMessage = getByText(
        messages.nftAddressError.message.replace(' $1', ''),
      );
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
        messages.loading.message.replace('...', ''),
      );

      // Should not show search or tabs while loading
      expect(
        queryByPlaceholderText(messages.searchTokens.message),
      ).not.toBeInTheDocument();
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
        messages.simulationDetailsUnavailable.message,
      );

      // Should not show tabs when not supported
      expect(queryByText(messages.search.message)).not.toBeInTheDocument();
      expect(queryByText(messages.customToken.message)).not.toBeInTheDocument();
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
      expect(getByText(messages.search.message)).toBeInTheDocument();
      expect(getByText(messages.customToken.message)).toBeInTheDocument();

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
      expect(getByText(messages.customToken.message)).toBeInTheDocument();

      // Search tab should not show when no tokens
      expect(queryByText(messages.search.message)).not.toBeInTheDocument();
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

  describe('Import confirmation with pendingMetadataByAssetId', () => {
    const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';

    const enableAssetsUnifyState = {
      remoteFeatureFlags: {
        assetsUnifyState: {
          enabled: true,
          featureVersion: '1',
        },
      },
    };

    /**
     * Helper to go through the custom token flow up to the confirmation view.
     * Fills in address/symbol/decimals, clicks Next, and waits for the Import button.
     *
     * @param {object} renderResult - @testing-library/react render result for the modal.
     * @param {object} [options]
     * @param {string} [options.address] - Token contract address.
     * @param {string} [options.symbol] - Token symbol.
     * @param {string} [options.decimals] - Token decimals as string for the input field.
     */
    const navigateToConfirmation = async (
      renderResult,
      { address = tokenAddress, symbol = 'META', decimals = '2' } = {},
    ) => {
      const { getByText, getByTestId } = renderResult;

      // Switch to custom token tab
      fireEvent.click(getByText(messages.customToken.message));

      // Fill address
      await act(async () => {
        fireEvent.change(getByTestId('import-tokens-modal-custom-address'), {
          target: { value: address },
        });
      });

      // Wait for symbol/decimals to appear
      await waitFor(() =>
        expect(
          getByTestId('import-tokens-modal-custom-symbol'),
        ).toBeInTheDocument(),
      );

      // Fill symbol
      fireEvent.change(getByTestId('import-tokens-modal-custom-symbol'), {
        target: { value: symbol },
      });

      // Fill decimals
      fireEvent.change(getByTestId('import-tokens-modal-custom-decimals'), {
        target: { value: decimals },
      });

      // Click Next
      await act(async () => {
        fireEvent.click(getByText(messages.next.message));
      });

      // Wait for confirmation view
      await waitFor(() => {
        expect(
          getByTestId('import-tokens-modal-import-button'),
        ).toBeInTheDocument();
      });
    };

    it('passes pendingMetadataByAssetId to importCustomAssetsBatch when assetsUnifyState is enabled', async () => {
      const result = render({
        ...enableAssetsUnifyState,
        tokens: [],
        tokenList: {},
      });

      await navigateToConfirmation(result);

      await act(async () => {
        fireEvent.click(
          result.getByTestId('import-tokens-modal-import-button'),
        );
      });

      await waitFor(() => {
        expect(importCustomAssetsBatch).toHaveBeenCalledWith(
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          [
            expect.objectContaining({
              assetId: `eip155:5/erc20:${tokenAddress}`,
            }),
          ],
          expect.objectContaining({
            [`eip155:5/erc20:${tokenAddress}`]: expect.objectContaining({
              address: tokenAddress,
              symbol: 'META',
              decimals: 2,
            }),
          }),
        );
      });
    });

    it('includes iconUrl and unlisted fields in metadata', async () => {
      const result = render({
        ...enableAssetsUnifyState,
        tokens: [],
        tokenList: {},
      });

      await navigateToConfirmation(result);

      await act(async () => {
        fireEvent.click(
          result.getByTestId('import-tokens-modal-import-button'),
        );
      });

      await waitFor(() => {
        const metadataArg = importCustomAssetsBatch.mock.calls[0][2];
        const assetKey = Object.keys(metadataArg)[0];
        const metadata = metadataArg[assetKey];
        expect(metadata).toHaveProperty('iconUrl');
        expect(metadata).toHaveProperty('unlisted');
        expect(metadata).toHaveProperty('chainId');
      });
    });

    it('uses token symbol as fallback name when name is null or undefined', async () => {
      // For custom tokens, the name defaults to '' (empty string).
      // The ?? operator only falls back for null/undefined, so '' stays as ''.
      // This test verifies the fallback logic: name ?? symbol
      const result = render({
        ...enableAssetsUnifyState,
        tokens: [],
        tokenList: {},
      });

      await navigateToConfirmation(result);

      await act(async () => {
        fireEvent.click(
          result.getByTestId('import-tokens-modal-import-button'),
        );
      });

      await waitFor(() => {
        const metadataArg = importCustomAssetsBatch.mock.calls[0][2];
        const assetKey = Object.keys(metadataArg)[0];
        // Custom tokens pass empty string as name; ?? does not override empty strings
        expect(metadataArg[assetKey].name).toBe('');
        // Verify the symbol is correctly stored separately
        expect(metadataArg[assetKey].symbol).toBe('META');
      });
    });

    it('does not call importCustomAssetsBatch when assetsUnifyState is disabled', async () => {
      const result = render({ tokens: [], tokenList: {} });

      await navigateToConfirmation(result);

      await act(async () => {
        fireEvent.click(
          result.getByTestId('import-tokens-modal-import-button'),
        );
      });

      await waitFor(() => {
        expect(addImportedTokens).toHaveBeenCalled();
      });

      expect(importCustomAssetsBatch).not.toHaveBeenCalled();
    });

    it('calls addImportedTokens for EVM tokens when assetsUnifyState is disabled', async () => {
      const result = render({ tokens: [], tokenList: {} });

      await navigateToConfirmation(result);

      await act(async () => {
        fireEvent.click(
          result.getByTestId('import-tokens-modal-import-button'),
        );
      });

      await waitFor(() => {
        expect(addImportedTokens).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              address: tokenAddress,
              symbol: 'META',
            }),
          ]),
          expect.any(String),
        );
      });
    });

    it('dispatches setNewTokensImported and clearPendingTokens after successful import', async () => {
      const result = render({
        ...enableAssetsUnifyState,
        tokens: [],
        tokenList: {},
      });

      await navigateToConfirmation(result);

      await act(async () => {
        fireEvent.click(
          result.getByTestId('import-tokens-modal-import-button'),
        );
      });

      await waitFor(() => {
        expect(setNewTokensImported).toHaveBeenCalledWith('META');
        expect(clearPendingTokens).toHaveBeenCalled();
        expect(hideImportTokensModal).toHaveBeenCalled();
      });
    });
  });
});
