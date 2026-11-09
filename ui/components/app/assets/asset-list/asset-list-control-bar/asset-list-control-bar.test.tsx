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
const DEFAULT_ACCOUNT_GROUP_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
const SOLANA_ACCOUNT_ID = 'solana-account-id';
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
      completedOnboarding: true,
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

const addSolanaAccountToSelectedGroup = (
  state: ReturnType<typeof createMockState>,
) => {
  (state.metamask.internalAccounts.accounts as Record<string, unknown>)[
    SOLANA_ACCOUNT_ID
  ] = {
    address: '7Ec4p8d1VzC9QYQ35gzfSNJbdf2D2qTyhQEt9Dz6F5CQ',
    id: SOLANA_ACCOUNT_ID,
    metadata: {
      importTime: 0,
      name: 'Solana Account',
      keyring: {
        type: 'Snap Keyring',
      },
    },
    options: {},
    methods: ['solana_signTransaction'],
    scopes: [SOLANA_CHAIN_ID],
    type: 'solana:data-account',
  };
  state.metamask.accountTree.wallets[
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
  ].groups[DEFAULT_ACCOUNT_GROUP_ID].accounts.push(SOLANA_ACCOUNT_ID);
};

const selectSolanaAccount = (state: ReturnType<typeof createMockState>) => {
  addSolanaAccountToSelectedGroup(state);
  state.metamask.internalAccounts.selectedAccount = SOLANA_ACCOUNT_ID;
  state.metamask.completedOnboarding = true;
};

describe('AssetListControlBar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders actionMenu when provided', async () => {
    const state = createMockState();
    const store = configureMockStore([thunk])(state);
    const mockMenu = <div data-testid="mock-action-menu">Mock Menu</div>;

    const { findByTestId } = renderWithProvider(
      <AssetListControlBar actionMenu={mockMenu} />,
      store,
    );

    const actionMenu = await findByTestId('mock-action-menu');
    expect(actionMenu).toBeInTheDocument();
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

  it('keeps the current EVM network when All networks is selected', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const setActiveNetworkSpy = jest.spyOn(actions, 'setActiveNetwork');
    const setEnabledAllPopularNetworksSpy = jest.spyOn(
      actions,
      'setEnabledAllPopularNetworks',
    );
    const state = createMockState();
    state.metamask.isEvmSelected = true;
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));
    fireEvent.click(await findByTestId('home-network-filter-all-default'));

    expect(setEnabledAllPopularNetworksSpy).toHaveBeenCalled();
    expect(setActiveNetworkSpy).not.toHaveBeenCalled();
  });

  it('activates an EVM network when All networks is selected from a non-EVM network', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const setActiveNetworkSpy = jest.spyOn(actions, 'setActiveNetwork');
    const setEnabledAllPopularNetworksSpy = jest.spyOn(
      actions,
      'setEnabledAllPopularNetworks',
    );
    const state = createMockState();
    state.metamask.isEvmSelected = false;
    state.metamask.selectedMultichainNetworkChainId = SOLANA_CHAIN_ID;
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));
    fireEvent.click(await findByTestId('home-network-filter-all-default'));

    expect(setEnabledAllPopularNetworksSpy).toHaveBeenCalled();
    expect(setActiveNetworkSpy).toHaveBeenCalledWith('selectedNetworkClientId');
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

    await waitFor(() => expect(enableAllPopularNetworksSpy).toHaveBeenCalled());
  });

  it('falls back to all popular networks when a non-hardware EVM-only account has an unsupported network filter', async () => {
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

    await waitFor(() => expect(enableAllPopularNetworksSpy).toHaveBeenCalled());
  });

  it('switches a non-EVM network filter to an EVM default when basic functionality is off', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const enableAllPopularNetworksSpy = jest.spyOn(
      actions,
      'setEnabledAllPopularNetworks',
    );
    const setActiveNetworkSpy = jest.spyOn(actions, 'setActiveNetwork');
    const state = createMockState();
    addSolanaAccountToSelectedGroup(state);
    Object.assign(state.metamask, { useExternalServices: false });
    state.metamask.enabledNetworkMap = {
      solana: {
        [SOLANA_CHAIN_ID]: true,
      },
    };
    const store = configureMockStore([thunk])(state);

    renderWithProvider(<AssetListControlBar />, store);

    await waitFor(() => {
      expect(enableAllPopularNetworksSpy).toHaveBeenCalled();
      expect(setActiveNetworkSpy).toHaveBeenCalledWith(
        'selectedNetworkClientId',
      );
    });
  });

  it('does not broaden an unsupported network filter when the selected account group supports that network', async () => {
    const enableAllPopularNetworksSpy = jest.spyOn(
      actions,
      'setEnabledAllPopularNetworks',
    );
    const state = createMockState();
    addSolanaAccountToSelectedGroup(state);
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

  it('disables Non-EVM network rows in the home network filter for EVM-only account groups', async () => {
    const state = createMockState();
    selectLedgerAccount(state);
    Object.assign(state.metamask, { useExternalServices: true });
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));

    expect(
      (
        await findByTestId(`home-network-filter-network-${SOLANA_CHAIN_ID}`)
      ).querySelector('.multichain-network-list-item--disabled'),
    ).toBeInTheDocument();
    expect(
      (
        await findByTestId(`home-network-filter-network-${SOLANA_CHAIN_ID}`)
      ).querySelector(
        `[data-title="${messages.networkNotSupportedByThisAccount.message}"]`,
      ),
    ).toBeInTheDocument();
  });

  it('shows Non-EVM network rows in the home network filter when the selected account group supports them', async () => {
    const state = createMockState();
    addSolanaAccountToSelectedGroup(state);
    Object.assign(state.metamask, { useExternalServices: true });
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));

    expect(
      await findByTestId(`home-network-filter-network-${SOLANA_CHAIN_ID}`),
    ).toBeInTheDocument();
  });

  it('opens the network filter modal and can navigate to manage networks', async () => {
    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));

    fireEvent.click(await findByTestId('home-network-filter-manage-networks'));

    expect(mockUseNavigate).toHaveBeenCalledWith(NETWORKS_ROUTE);
  });

  it('renders actionMenu when provided', async () => {
    const state = createMockState();
    const store = configureMockStore([thunk])(state);
    const mockMenu = <div data-testid="mock-action-menu">Mock Menu</div>;

    const { findByTestId } = renderWithProvider(
      <AssetListControlBar actionMenu={mockMenu} />,
      store,
    );

    const actionMenu = await findByTestId('mock-action-menu');
    expect(actionMenu).toBeInTheDocument();
  });

  it('does not render actionMenu when not provided', () => {
    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { queryByTestId } = renderWithProvider(
      <AssetListControlBar />,
      store,
    );

    expect(
      queryByTestId('asset-list-control-bar-action-button'),
    ).not.toBeInTheDocument();
  });
});
