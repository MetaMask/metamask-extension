import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import type { NetworkConfiguration } from '@metamask/network-controller';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../../app/_locales/en/messages.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../../../store/actions';
import { setBackgroundConnection } from '../../../../../store/background-connection';
import { NETWORKS_ROUTE } from '../../../../../helpers/constants/routes';
import { AssetControls } from './asset-controls';
import { NetworkFilter } from './network-filter';
import {
  SOLANA_CHAIN_ID,
  addSolanaAccountToSelectedGroup,
  createMockState,
  selectLedgerAccount,
} from './control-bar-test-utils';

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
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

const renderNetworkFilter = (
  state: ReturnType<typeof createMockState>,
  onNetworkSelect?: (networks: string[]) => void,
) => {
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(
    <AssetControls>
      <NetworkFilter onNetworkSelect={onNetworkSelect} />
    </AssetControls>,
    store,
  );
};

describe('NetworkFilter', () => {
  beforeEach(() => {
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports the enabled networks as CAIP ids', async () => {
    const onNetworkSelect = jest.fn();
    const state = createMockState();
    state.metamask.enabledNetworkMap = {
      eip155: {
        '0x1': true,
      },
    };

    renderNetworkFilter(state, onNetworkSelect);

    await waitFor(() =>
      expect(onNetworkSelect).toHaveBeenCalledWith(['eip155:1']),
    );
  });

  it('enables all popular networks when a hardware wallet has an unsupported filter', async () => {
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

    renderNetworkFilter(state);

    await waitFor(() => expect(enableAllPopularNetworksSpy).toHaveBeenCalled());
  });

  it('enables all popular networks when an EVM-only account has an unsupported filter', async () => {
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

    renderNetworkFilter(state);

    await waitFor(() => expect(enableAllPopularNetworksSpy).toHaveBeenCalled());
  });

  it('leaves an unsupported filter when the account group supports that network', async () => {
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

    renderNetworkFilter(state);

    await waitFor(() =>
      expect(enableAllPopularNetworksSpy).not.toHaveBeenCalled(),
    );
  });

  it('switches a hidden non-EVM filter to an EVM network when basic functionality is off', async () => {
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

    renderNetworkFilter(state);

    await waitFor(() => {
      expect(enableAllPopularNetworksSpy).toHaveBeenCalled();
      expect(setActiveNetworkSpy).toHaveBeenCalledWith(
        'selectedNetworkClientId',
      );
    });
  });

  it('labels selected default networks as All networks when no custom networks are visible', async () => {
    const state = createMockState();
    state.metamask.preferences.showTestNetworks = false;
    state.metamask.enabledNetworkMap = {
      eip155: {
        '0x1': true,
        '0x89': true,
      },
    };

    const { findByTestId } = renderNetworkFilter(state);

    const networkFilterButton = await findByTestId('sort-by-networks');
    expect(networkFilterButton).toHaveTextContent(messages.allNetworks.message);

    fireEvent.click(networkFilterButton);
    expect(
      await findByTestId('home-network-filter-all-default'),
    ).toHaveTextContent(messages.allNetworks.message);
  });

  it('labels selected default networks as All default networks when a custom network exists', async () => {
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

    const { findByTestId } = renderNetworkFilter(state);

    const networkFilterButton = await findByTestId('sort-by-networks');
    expect(networkFilterButton).toHaveTextContent(
      messages.allDefaultNetworks.message,
    );

    fireEvent.click(networkFilterButton);
    expect(
      await findByTestId('home-network-filter-all-default'),
    ).toHaveTextContent(messages.allDefaultNetworks.message);
  });

  it('disables non-EVM rows for an EVM-only account group', async () => {
    const state = createMockState();
    selectLedgerAccount(state);
    Object.assign(state.metamask, { useExternalServices: true });

    const { findByTestId } = renderNetworkFilter(state);

    fireEvent.click(await findByTestId('sort-by-networks'));

    const solanaRow = await findByTestId(
      `home-network-filter-network-${SOLANA_CHAIN_ID}`,
    );
    expect(
      solanaRow.querySelector('.multichain-network-list-item--disabled'),
    ).toBeInTheDocument();
    expect(
      solanaRow.querySelector(
        `[data-title="${messages.networkNotSupportedByThisAccount.message}"]`,
      ),
    ).toBeInTheDocument();
  });

  it('shows non-EVM rows when the account group supports them', async () => {
    const state = createMockState();
    addSolanaAccountToSelectedGroup(state);
    Object.assign(state.metamask, { useExternalServices: true });

    const { findByTestId } = renderNetworkFilter(state);

    fireEvent.click(await findByTestId('sort-by-networks'));

    expect(
      await findByTestId(`home-network-filter-network-${SOLANA_CHAIN_ID}`),
    ).toBeInTheDocument();
  });

  it('opens the networks page from the filter modal', async () => {
    const state = createMockState();

    const { findByTestId } = renderNetworkFilter(state);

    fireEvent.click(await findByTestId('sort-by-networks'));
    fireEvent.click(await findByTestId('home-network-filter-manage-networks'));

    expect(mockUseNavigate).toHaveBeenCalledWith(NETWORKS_ROUTE);
  });
});
