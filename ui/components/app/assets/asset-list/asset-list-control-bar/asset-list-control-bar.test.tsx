import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import type { NetworkConfiguration } from '@metamask/network-controller';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../../app/_locales/en/messages.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import * as actions from '../../../../../store/actions';
import { setBackgroundConnection } from '../../../../../store/background-connection';
import {
  ASSETS_ROUTE,
  NETWORKS_ROUTE,
  TOKEN_MANAGEMENT_ROUTE,
} from '../../../../../helpers/constants/routes';
import AssetListControlBar from './asset-list-control-bar';

let mockIsNetworkManagementEnabled = true;

jest.mock('../../../../../selectors/multichain/feature-flags', () => ({
  ...jest.requireActual('../../../../../selectors/multichain/feature-flags'),
  getIsNetworkManagementEnabled: () => mockIsNetworkManagementEnabled,
}));

type TooltipProps = {
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
};

jest.mock('../../../../ui/tooltip', () => {
  const MockTooltip = ({ children, disabled, title }: TooltipProps) => (
    <div data-testid="tooltip" data-disabled={disabled} data-title={title}>
      {children}
    </div>
  );

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: MockTooltip,
  };
});

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

const LEDGER_ACCOUNT_ID = '15e69915-2a1a-4019-93b3-916e11fd432f';
const LEDGER_ACCOUNT_GROUP_ID =
  'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

const createMockState = () => {
  const state = structuredClone(mockState);

  return {
    ...state,
    metamask: {
      ...state.metamask,
      internalAccounts: {
        ...state.metamask.internalAccounts,
        accounts: {
          ...state.metamask.internalAccounts.accounts,
        },
      },
      accountTree: structuredClone(state.metamask.accountTree),
      multichainNetworkConfigurationsByChainId: {
        ...state.metamask.multichainNetworkConfigurationsByChainId,
      },
      selectedNetworkClientId: 'selectedNetworkClientId',
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'selectedNetworkClientId',
            },
          ],
        },
      } as unknown as Record<string, NetworkConfiguration>,
      useNftDetection: true,
    },
  };
};

const selectLedgerAccount = (state: ReturnType<typeof createMockState>) => {
  state.metamask.internalAccounts.selectedAccount = LEDGER_ACCOUNT_ID;
  state.metamask.selectedAccountGroup = LEDGER_ACCOUNT_GROUP_ID;
};

describe('NFTs options', () => {
  afterEach(() => {
    mockIsNetworkManagementEnabled = true;
    jest.clearAllMocks();
  });

  it('should render a link "Refresh list" when some NFTs are present on mainnet and NFT auto-detection preference is set to true, which, when clicked calls methods DetectNFTs and checkAndUpdateNftsOwnershipStatus', async () => {
    const detectNftsSpy = jest.spyOn(actions, 'detectNfts');
    const checkAndUpdateAllNftsOwnershipStatusSpy = jest.spyOn(
      actions,
      'checkAndUpdateAllNftsOwnershipStatus',
    );

    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const sortButton = await findByTestId('sort-by-popover-toggle');
    let tooltipWrapper = sortButton.closest('[data-testid="tooltip"]');
    expect(tooltipWrapper).toHaveAttribute('data-disabled', 'false');

    fireEvent.click(sortButton);

    tooltipWrapper = sortButton.closest('[data-testid="tooltip"]');
    expect(tooltipWrapper).toHaveAttribute('data-disabled', 'true');

    const actionButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    fireEvent.click(actionButton);

    const refreshButton = await findByTestId('refresh-list-button__button');

    expect(detectNftsSpy).not.toHaveBeenCalled();
    expect(checkAndUpdateAllNftsOwnershipStatusSpy).not.toHaveBeenCalled();
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);

    expect(detectNftsSpy).toHaveBeenCalled();
    expect(checkAndUpdateAllNftsOwnershipStatusSpy).toHaveBeenCalled();
  });

  it('should render a link "Refresh list" when some NFTs are present on a non-mainnet chain, which, when clicked calls a method checkAndUpdateNftsOwnershipStatus', async () => {
    const detectNftsSpy = jest.spyOn(actions, 'detectNfts');
    const checkAndUpdateAllNftsOwnershipStatusSpy = jest.spyOn(
      actions,
      'checkAndUpdateAllNftsOwnershipStatus',
    );

    const state = createMockState();
    state.metamask.networkConfigurationsByChainId = {
      '0xe708': {
        chainId: '0xe708',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            networkClientId: 'selectedNetworkClientId',
          },
        ],
      } as unknown as NetworkConfiguration,
    };
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const actionButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    fireEvent.click(actionButton);

    const refreshButton = await findByTestId('refresh-list-button__button');

    expect(detectNftsSpy).not.toHaveBeenCalled();
    expect(checkAndUpdateAllNftsOwnershipStatusSpy).not.toHaveBeenCalled();
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);

    expect(detectNftsSpy).toHaveBeenCalled();
    expect(checkAndUpdateAllNftsOwnershipStatusSpy).toHaveBeenCalled();
  });

  it('should render a link "Enable autodetect" when some NFTs are present and NFT auto-detection preference is set to false, which, when clicked sends user to the experimental tab of settings', async () => {
    const detectNftsSpy = jest.spyOn(actions, 'detectNfts');
    const checkAndUpdateAllNftsOwnershipStatusSpy = jest.spyOn(
      actions,
      'checkAndUpdateAllNftsOwnershipStatus',
    );

    const state = createMockState();
    // Override for disabled NFT detection and non-mainnet
    state.metamask.useNftDetection = false;
    state.metamask.networkConfigurationsByChainId = {
      '0xe708': {
        chainId: '0xe708',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            networkClientId: 'selectedNetworkClientId',
          },
        ],
      } as unknown as NetworkConfiguration,
    };
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const actionButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    fireEvent.click(actionButton);

    const autodetectButton = await findByTestId(
      'enable-autodetect-button__button',
    );

    expect(detectNftsSpy).not.toHaveBeenCalled();
    expect(checkAndUpdateAllNftsOwnershipStatusSpy).not.toHaveBeenCalled();
    expect(autodetectButton).toBeInTheDocument();

    fireEvent.click(autodetectButton);
    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ASSETS_ROUTE}#autodetect-tokens`,
    );
  });

  it('shows Manage tokens instead of Import tokens when the token management feature flag is enabled', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const state = createMockState();
    state.metamask.remoteFeatureFlags = {
      ...state.metamask.remoteFeatureFlags,
      extensionUxTokenManagementFilter: true,
    };
    const store = configureMockStore([thunk])(state);

    const { findByTestId, queryByTestId } = renderWithProvider(
      <AssetListControlBar showTokensLinks />,
      store,
    );

    const actionButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    fireEvent.click(actionButton);

    const manageTokensButton = await findByTestId('manageTokens__button');

    expect(manageTokensButton).toHaveTextContent(messages.manageTokens.message);
    expect(queryByTestId('importTokens__button')).not.toBeInTheDocument();

    fireEvent.click(manageTokensButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(TOKEN_MANAGEMENT_ROUTE, {
      state: {
        globalMenuTransition: 'forward',
      },
    });
  });

  it('navigates to the dedicated networks page from manage networks in the home modal', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));
    fireEvent.click(await findByTestId('home-network-filter-manage-networks'));

    expect(mockUseNavigate).toHaveBeenCalledWith(NETWORKS_ROUTE);
  });

  it('labels selected default networks as All networks when there are no custom or test networks visible', async () => {
    const state = createMockState();
    state.metamask.preferences.showTestNetworks = false;
    state.metamask.enabledNetworkMap = {
      eip155: {
        '0x1': true,
        '0x89': true,
      },
    };
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const networkFilterButton = await findByTestId('sort-by-networks');
    expect(networkFilterButton).toHaveTextContent(messages.allNetworks.message);

    fireEvent.click(networkFilterButton);
    expect(
      await findByTestId('home-network-filter-all-default'),
    ).toHaveTextContent(messages.allNetworks.message);
  });

  it('labels selected default networks as All default networks when custom networks exist', async () => {
    const state = createMockState();
    state.metamask.preferences.showTestNetworks = false;
    state.metamask.enabledNetworkMap = {
      eip155: {
        '0x1': true,
        '0x89': true,
      },
    };
    state.metamask.networkConfigurationsByChainId = {
      ...state.metamask.networkConfigurationsByChainId,
      '0x123': {
        chainId: '0x123',
        name: 'Custom Network',
        nativeCurrency: 'TST',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            networkClientId: 'customNetworkClientId',
            type: 'custom',
            url: 'https://custom-network.example',
          },
        ],
        blockExplorerUrls: [],
      } as unknown as NetworkConfiguration,
    };
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const networkFilterButton = await findByTestId('sort-by-networks');
    expect(networkFilterButton).toHaveTextContent(
      messages.allDefaultNetworks.message,
    );

    fireEvent.click(networkFilterButton);
    expect(
      await findByTestId('home-network-filter-all-default'),
    ).toHaveTextContent(messages.allDefaultNetworks.message);
  });

  it('calls onNetworkSelect with CAIP IDs when one network is enabled', async () => {
    const onNetworkSelect = jest.fn();
    const state = createMockState();
    state.metamask.enabledNetworkMap = {
      eip155: {
        '0x1': true,
      },
    };
    const store = configureMockStore([thunk])(state);

    renderWithProvider(
      <AssetListControlBar onNetworkSelect={onNetworkSelect} />,
      store,
    );

    await waitFor(() =>
      expect(onNetworkSelect).toHaveBeenCalledWith(['eip155:1']),
    );
  });

  it('falls back to all popular networks when a hardware wallet has an unsupported network filter', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const enableAllPopularNetworksSpy = jest.spyOn(
      actions,
      'setEnabledAllPopularNetworks',
    );
    const state = createMockState();
    selectLedgerAccount(state);
    state.metamask.enabledNetworkMap = {
      solana: {
        [SOLANA_CHAIN_ID]: true,
      },
    };
    const store = configureMockStore([thunk])(state);

    renderWithProvider(<AssetListControlBar />, store);

    await waitFor(() =>
      expect(enableAllPopularNetworksSpy).toHaveBeenCalled(),
    );
  });

  it('does not broaden an unsupported network filter for a non-hardware account', async () => {
    const enableAllPopularNetworksSpy = jest.spyOn(
      actions,
      'setEnabledAllPopularNetworks',
    );
    const state = createMockState();
    state.metamask.enabledNetworkMap = {
      solana: {
        [SOLANA_CHAIN_ID]: true,
      },
    };
    const store = configureMockStore([thunk])(state);

    renderWithProvider(<AssetListControlBar />, store);

    await waitFor(() =>
      expect(enableAllPopularNetworksSpy).not.toHaveBeenCalled(),
    );
  });

  it('does not show Non-EVM network rows in the home network filter for hardware wallets', async () => {
    const state = createMockState();
    selectLedgerAccount(state);
    state.metamask.useExternalServices = true;
    const store = configureMockStore([thunk])(state);

    const { findByTestId, queryByTestId } = renderWithProvider(
      <AssetListControlBar />,
      store,
    );

    fireEvent.click(await findByTestId('sort-by-networks'));

    expect(
      queryByTestId(`home-network-filter-network-${SOLANA_CHAIN_ID}`),
    ).not.toBeInTheDocument();
  });

  it('opens the network filter modal and can navigate to manage networks', async () => {
    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));

    fireEvent.click(await findByTestId('home-network-filter-manage-networks'));

    expect(mockUseNavigate).toHaveBeenCalledWith(NETWORKS_ROUTE);
  });

  it('opens the legacy Network Manager modal when network management feature flag is disabled', async () => {
    mockIsNetworkManagementEnabled = false;
    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));

    expect(store.getActions()).toContainEqual(
      expect.objectContaining({
        payload: { name: 'NETWORK_MANAGER' },
      }),
    );
  });
});
