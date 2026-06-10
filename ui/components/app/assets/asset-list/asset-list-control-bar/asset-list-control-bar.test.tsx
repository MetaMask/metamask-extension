import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import type { NetworkConfiguration } from '@metamask/network-controller';
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

const createMockState = () => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
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
});

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

    expect(manageTokensButton).toHaveTextContent('Manage tokens');
    expect(queryByTestId('importTokens__button')).not.toBeInTheDocument();

    fireEvent.click(manageTokensButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(TOKEN_MANAGEMENT_ROUTE);
  });

  it('shows Import tokens when the token management feature flag is disabled', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const state = createMockState();
    state.metamask.remoteFeatureFlags = {
      ...state.metamask.remoteFeatureFlags,
      extensionUxTokenManagementFilter: false,
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

    expect(await findByTestId('importTokens__button')).toHaveTextContent(
      'Import tokens',
    );
    expect(queryByTestId('manageTokens__button')).not.toBeInTheDocument();
  });

  it('navigates to the dedicated networks page from manage networks in the home modal', async () => {
    setBackgroundConnection(backgroundConnectionMock as never);
    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    fireEvent.click(await findByTestId('sort-by-networks'));
    fireEvent.click(await findByTestId('home-network-filter-manage-networks'));

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${NETWORKS_ROUTE}?drawerOpen=true`,
    );
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

  it('opens the network filter modal and can navigate to manage networks', async () => {
    const state = createMockState();
    const store = configureMockStore([thunk])(state);

    const { findByTestId, findByText } = renderWithProvider(
      <AssetListControlBar />,
      store,
    );

    fireEvent.click(await findByTestId('sort-by-networks'));

    expect(await findByText('Select network')).toBeInTheDocument();
    expect(await findByText('All default networks')).toBeInTheDocument();
    expect(await findByText('Default networks')).toBeInTheDocument();

    fireEvent.click(await findByTestId('home-network-filter-manage-networks'));

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${NETWORKS_ROUTE}?drawerOpen=true`,
    );
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
