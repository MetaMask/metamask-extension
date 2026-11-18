import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  addNftVerifyOwnership,
  ignoreTokens,
  updateNftDropDownState,
} from '../../../store/actions';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { ImportNftsPage } from '../../../pages/import-nfts';

const VALID_ADDRESS = '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9';
const INVALID_ADDRESS = 'aoinsafasdfa';
const VALID_TOKENID = '1201';
const INVALID_TOKENID = 'abcde';
const EXISTING_NFT_ADDRESS = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
const EXISTING_TOKEN_ID =
  '58076532811975507823669075598676816378162417803895263482849101575514658701313';

const mockToastSuccess = jest.fn<void, unknown[]>();
const mockToastError = jest.fn<void, unknown[]>();

const getImportButton = () =>
  screen.getByRole('button', { name: messages.save.message });

const mockStateWithTestNetworks = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      showTestNetworks: true,
    },
  },
};

jest.mock('../../../store/actions.ts', () => ({
  addNftVerifyOwnership: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(undefined)),
  getTokenStandardAndDetails: jest.fn().mockResolvedValue(undefined),
  ignoreTokens: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(undefined)),
  updateNftDropDownState: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(undefined)),
  hideImportNftsModal: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(undefined)),
}));

jest.mock('../../ui/toast/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
  ToastContent: ({ title }: { title: React.ReactNode }) => title,
}));

const mockGetIsBasicFunctionalityConsolidationEnabled = jest.fn(() => false);

jest.mock('../../../selectors/multichain/feature-flags', () => ({
  ...jest.requireActual('../../../selectors/multichain/feature-flags'),
  getIsBasicFunctionalityConsolidationEnabled: () =>
    mockGetIsBasicFunctionalityConsolidationEnabled(),
}));

const mockAddNftVerifyOwnership = jest.mocked(addNftVerifyOwnership);

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('ImportNftsPage', () => {
  let store = configureMockStore([thunk])(mockStateWithTestNetworks);

  beforeEach(() => {
    jest.restoreAllMocks();
    store = configureMockStore([thunk])(mockStateWithTestNetworks);
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockGetIsBasicFunctionalityConsolidationEnabled.mockReturnValue(false);
  });

  describe('NFT detection notice', () => {
    const createStoreWithPreferences = ({
      useExternalServices,
      openSeaEnabled,
    }: {
      useExternalServices: boolean;
      openSeaEnabled: boolean;
    }) =>
      configureMockStore([thunk])({
        ...mockStateWithTestNetworks,
        metamask: {
          ...mockStateWithTestNetworks.metamask,
          useExternalServices,
          openSeaEnabled,
        },
      });

    it('shows the notice on any network when basic functionality is off', () => {
      mockGetIsBasicFunctionalityConsolidationEnabled.mockReturnValue(true);
      store = createStoreWithPreferences({
        useExternalServices: false,
        openSeaEnabled: true,
      });

      renderWithProvider(<ImportNftsPage />, store);

      expect(
        screen.getByRole('button', {
          name: messages.turnOnBasicFunctionality.message,
        }),
      ).toBeInTheDocument();
    });

    it('hides the notice when basic functionality is on', () => {
      mockGetIsBasicFunctionalityConsolidationEnabled.mockReturnValue(true);
      store = createStoreWithPreferences({
        useExternalServices: true,
        openSeaEnabled: false,
      });

      renderWithProvider(<ImportNftsPage />, store);

      expect(
        screen.queryByRole('button', {
          name: messages.turnOnBasicFunctionality.message,
        }),
      ).not.toBeInTheDocument();
    });

    it('shows the legacy notice when Ethereum is picked in the form even if the wallet is on another network', () => {
      store = createStoreWithPreferences({
        useExternalServices: true,
        openSeaEnabled: false,
      });

      renderWithProvider(<ImportNftsPage />, store);

      expect(
        screen.queryByText(
          messages.selectEnableDisplayMediaPrivacyPreference.message,
        ),
      ).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByTestId('test-import-tokens-drop-down-custom-import'),
      );
      fireEvent.click(
        screen.getByTestId(`network-list-item-${CHAIN_IDS.MAINNET}`),
      );

      expect(
        screen.getByText(
          messages.selectEnableDisplayMediaPrivacyPreference.message,
        ),
      ).toBeInTheDocument();
    });
  });

  it('should enable the "Import" button when valid entries are input into both Address and TokenId fields and a network is selected', () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );
    expect(getImportButton()).not.toBeEnabled();

    // Select a network first
    const networkSelectorButton = getByTestId(
      'test-import-tokens-drop-down-custom-import',
    );
    fireEvent.click(networkSelectorButton);
    const networkItem = getByTestId('Goerli');
    fireEvent.click(networkItem);

    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText(
      messages.nftTokenIdPlaceholder.message,
    );
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.change(tokenIdInput, {
      target: { value: VALID_TOKENID },
    });
    expect(getImportButton()).toBeEnabled();
  });

  it('shows the current network name and enables import without picking a network again', () => {
    const { getByPlaceholderText } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );
    expect(
      screen.getByRole('button', {
        name: `${messages.network.message}: ${messages.networkNameGoerli.message}`,
      }),
    ).toBeInTheDocument();
    expect(getImportButton()).not.toBeEnabled();

    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText(
      messages.nftTokenIdPlaceholder.message,
    );
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.change(tokenIdInput, {
      target: { value: VALID_TOKENID },
    });

    expect(getImportButton()).toBeEnabled();
  });

  it('should not enable the "Import" button when an invalid entry is input into one or both Address and TokenId fields', () => {
    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );
    expect(getImportButton()).not.toBeEnabled();

    // Select a network first
    const networkSelectorButton = getByTestId(
      'test-import-tokens-drop-down-custom-import',
    );
    fireEvent.click(networkSelectorButton);
    const networkItem = getByTestId('Goerli');
    fireEvent.click(networkItem);

    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText(
      messages.nftTokenIdPlaceholder.message,
    );
    fireEvent.change(addressInput, {
      target: { value: INVALID_ADDRESS },
    });
    fireEvent.change(tokenIdInput, {
      target: { value: VALID_TOKENID },
    });

    expect(getImportButton()).not.toBeEnabled(); // Invalid token address, valid token id

    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });

    expect(getImportButton()).toBeEnabled(); // Valid token address, valid token id

    fireEvent.change(tokenIdInput, {
      target: { value: INVALID_TOKENID },
    });

    expect(getImportButton()).not.toBeEnabled(); // Valid token address, invalid token id
  });

  it('should call addNftVerifyOwnership, updateNftDropDownState, show success toast, and ignoreTokens action with correct values (tokenId should not be in scientific notation)', async () => {
    store = configureMockStore([thunk])({
      ...mockStateWithTestNetworks,
      appState: { importNftsModal: { ignoreErc20Token: true } },
    });

    const { getByPlaceholderText, getByTestId } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );

    // Click network selector button
    const networkSelectorButton = getByTestId(
      'test-import-tokens-drop-down-custom-import',
    );
    fireEvent.click(networkSelectorButton);

    // Select custom network
    const customNetworkItem = getByTestId('Goerli');
    fireEvent.click(customNetworkItem);

    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText(
      messages.nftTokenIdPlaceholder.message,
    );
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    const LARGE_TOKEN_ID = Number.MAX_SAFE_INTEGER + 1;
    fireEvent.change(tokenIdInput, {
      target: { value: LARGE_TOKEN_ID },
    });

    fireEvent.click(getImportButton());

    await waitFor(() => {
      expect(addNftVerifyOwnership).toHaveBeenCalledWith(
        '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9',
        '9007199254740992',
        'goerli',
        false,
      );

      expect(updateNftDropDownState).toHaveBeenCalledWith({
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          '0x5': {
            '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9': true,
            '0x495f947276749Ce646f68AC8c248420045cb7b5e': false,
          },
        },
      });

      expect(mockToastSuccess).toHaveBeenCalled();

      expect(ignoreTokens).toHaveBeenCalledWith({
        dontShowLoadingIndicator: true,
        tokensToIgnore: [VALID_ADDRESS],
        networkClientId: 'goerli',
      });
    });
  });

  it('should show error toast on import failure', async () => {
    mockAddNftVerifyOwnership.mockImplementation(() =>
      jest.fn().mockRejectedValue(new Error('error')),
    );

    const { getByTestId, getByPlaceholderText } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );

    // Select a network first
    const networkSelectorButton = getByTestId(
      'test-import-tokens-drop-down-custom-import',
    );
    fireEvent.click(networkSelectorButton);
    const networkItem = getByTestId('Goerli');
    fireEvent.click(networkItem);

    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText(
      messages.nftTokenIdPlaceholder.message,
    );
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    const LARGE_TOKEN_ID = Number.MAX_SAFE_INTEGER + 1;
    fireEvent.change(tokenIdInput, {
      target: { value: LARGE_TOKEN_ID },
    });

    fireEvent.click(getImportButton());

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it('should set error message when address invalid', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );

    const addressInput = getByPlaceholderText('0x...');
    fireEvent.change(addressInput, {
      target: { value: INVALID_ADDRESS },
    });
    expect(
      screen.queryByText(messages.invalidAddress.message),
    ).not.toBeInTheDocument();

    fireEvent.blur(addressInput);

    const errorMessage = getByText(messages.invalidAddress.message);
    expect(errorMessage).toBeInTheDocument();
    expect(addressInput).toHaveAttribute('aria-invalid', 'true');
    expect(addressInput).toHaveAttribute(
      'aria-describedby',
      'import-nfts-address-error',
    );
    expect(errorMessage).toHaveAttribute('id', 'import-nfts-address-error');
  });

  it('blocks import of an already added NFT on submit and when the address changes', () => {
    store = configureMockStore([thunk])({
      ...mockStateWithTestNetworks,
      metamask: {
        ...mockStateWithTestNetworks.metamask,
        enabledNetworkMap: {
          eip155: {
            '0x5': true,
          },
        },
      },
    });
    mockAddNftVerifyOwnership.mockClear();

    const { getByPlaceholderText } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );
    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText(
      messages.nftTokenIdPlaceholder.message,
    );

    fireEvent.change(addressInput, {
      target: { value: EXISTING_NFT_ADDRESS },
    });
    fireEvent.change(tokenIdInput, {
      target: { value: EXISTING_TOKEN_ID },
    });
    fireEvent.submit(addressInput.closest('form') as HTMLFormElement);

    expect(
      screen.getByText(messages.nftAlreadyAdded.message),
    ).toBeInTheDocument();
    expect(addNftVerifyOwnership).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();

    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    expect(
      screen.queryByText(messages.nftAlreadyAdded.message),
    ).not.toBeInTheDocument();

    fireEvent.change(addressInput, {
      target: { value: EXISTING_NFT_ADDRESS },
    });
    expect(
      screen.getByText(messages.nftAlreadyAdded.message),
    ).toBeInTheDocument();
    fireEvent.submit(addressInput.closest('form') as HTMLFormElement);
    expect(addNftVerifyOwnership).not.toHaveBeenCalled();
  });

  it('selectedNetworkClientId is for the network the NFT is on, not the globally selected network of the wallet', async () => {
    const customNetwork = {
      rpcUrl: 'https://alt-rpc.rpc.com',
      chainId: '0x123' as const,
      ticker: 'ETH',
      nickname: 'Custom Network',
      id: 'custom-network-client-id',
      blockExplorerUrl: undefined,
    };

    store = configureMockStore([thunk])({
      ...mockStateWithTestNetworks,
      metamask: {
        ...mockStateWithTestNetworks.metamask,
        ...mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
          customNetwork,
        ),
      },
    });

    const { getByText, getByPlaceholderText, getByTestId } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );

    // Click network selector button
    const networkSelectorButton = getByTestId(
      'test-import-tokens-drop-down-custom-import',
    );
    fireEvent.click(networkSelectorButton);

    // Select custom network
    const customNetworkItem = getByText('Custom Network');
    fireEvent.click(customNetworkItem);

    // Enter NFT details
    const addressInput = getByPlaceholderText('0x...');
    const tokenIdInput = getByPlaceholderText(
      messages.nftTokenIdPlaceholder.message,
    );
    fireEvent.change(addressInput, {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.change(tokenIdInput, {
      target: { value: VALID_TOKENID },
    });

    // Click import
    fireEvent.click(getImportButton());

    // Get the actual networkClientId that was used in the addNftVerifyOwnership call (use last call to be robust against previous test calls)
    const addNftCalls = mockAddNftVerifyOwnership.mock.calls;
    const lastCall = addNftCalls[addNftCalls.length - 1];
    const usedNetworkClientId = lastCall[2]; // Third argument is the networkClientId

    expect(addNftVerifyOwnership).toHaveBeenCalledWith(
      VALID_ADDRESS,
      VALID_TOKENID,
      'custom-network-client-id',
      false,
    );

    // Verify that the selectedNetworkClientId used for the NFT import is different from the globally selected network
    expect(mockState.metamask.selectedNetworkClientId).not.toBe(
      usedNetworkClientId,
    );
  });

  it('should go back when the back button is clicked', () => {
    const { getByTestId } = renderWithProvider(<ImportNftsPage />, store);

    fireEvent.click(getByTestId('import-nfts-back-button'));

    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('does not show test networks when test networks are disabled', () => {
    store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showTestNetworks: false,
        },
      },
    });

    const { getByTestId, queryByText } = renderWithProvider(
      <ImportNftsPage />,
      store,
    );

    fireEvent.click(getByTestId('test-import-tokens-drop-down-custom-import'));

    expect(queryByText('Sepolia')).not.toBeInTheDocument();
  });

  it('shows the current test network when test networks are disabled', () => {
    store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...mockNetworkState({ chainId: CHAIN_IDS.LOCALHOST }),
        preferences: {
          ...mockState.metamask.preferences,
          showTestNetworks: false,
        },
      },
    });

    const { getByTestId } = renderWithProvider(<ImportNftsPage />, store);

    fireEvent.click(getByTestId('test-import-tokens-drop-down-custom-import'));

    expect(
      getByTestId(`network-list-item-${CHAIN_IDS.LOCALHOST}`),
    ).toBeInTheDocument();
  });

  it('should route to default route when close button is clicked', () => {
    const { getByTestId } = renderWithProvider(<ImportNftsPage />, store);

    fireEvent.click(getByTestId('import-nfts-close-button'));

    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });
});
