import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { fireEvent } from '../../../../../../test/jest';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import mockState from '../../../../../../test/data/mock-state.json';
import * as actions from '../../../../../store/actions';
import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';
import AssetListControlBar from './asset-list-control-bar';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('AssetListControlBar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fire metrics event when refresh button is clicked', async () => {
    const store = configureMockStore([thunk])({
      metamask: {
        selectedNetworkClientId: 'selectedNetworkClientId',
        enabledNetworkMap: {
          eip155: {
            '0x1': true,
          },
        },
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
        },
        multichainNetworkConfigurationsByChainId:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
        selectedMultichainNetworkChainId: 'eip155:1',
        isEvmSelected: true,
        internalAccounts: {
          selectedAccount: 'selectedAccount',
          accounts: {
            selectedAccount: {},
          },
        },
      },
    });

    const mockTrackEvent = jest.fn();

    const { findByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <AssetListControlBar showTokensLinks />
      </MetaMetricsContext.Provider>,
      store,
    );

    const importButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    importButton.click();

    const refreshListItem = await findByTestId('refreshList__button');
    refreshListItem.click();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Tokens,
      event: MetaMetricsEventName.TokenListRefreshed,
    });
  });
});

describe('NFTs options', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render a link "Refresh list" when some NFTs are present on mainnet and NFT auto-detection preference is set to true, which, when clicked calls methods DetectNFTs and checkAndUpdateNftsOwnershipStatus', async () => {
    const detectNftsSpy = jest.spyOn(actions, 'detectNfts');
    const checkAndUpdateAllNftsOwnershipStatusSpy = jest.spyOn(
      actions,
      'checkAndUpdateAllNftsOwnershipStatus',
    );

    const store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useNftDetection: true,
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
        },
        internalAccounts: {
          selectedAccount: 'selectedAccount',
          accounts: {
            selectedAccount: {},
          },
        },
      },
    });

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const actionButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    actionButton.click();

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

    const store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useNftDetection: true,
        selectedNetworkClientId: 'selectedNetworkClientId',
        networkConfigurationsByChainId: {
          '0xe708': {
            chainId: '0xe708',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'selectedNetworkClientId',
              },
            ],
          },
        },
        internalAccounts: {
          selectedAccount: 'selectedAccount',
          accounts: {
            selectedAccount: {},
          },
        },
      },
    });

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const actionButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    actionButton.click();

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

    const store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useNftDetection: false,
        selectedNetworkClientId: 'selectedNetworkClientId',
        networkConfigurationsByChainId: {
          '0xe708': {
            chainId: '0xe708',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'selectedNetworkClientId',
              },
            ],
          },
        },
        internalAccounts: {
          selectedAccount: 'selectedAccount',
          accounts: {
            selectedAccount: {},
          },
        },
      },
    });

    const { findByTestId } = renderWithProvider(<AssetListControlBar />, store);

    const actionButton = await findByTestId(
      'asset-list-control-bar-action-button',
    );
    actionButton.click();

    const autodetectButton = await findByTestId(
      'enable-autodetect-button__button',
    );

    expect(detectNftsSpy).not.toHaveBeenCalled();
    expect(checkAndUpdateAllNftsOwnershipStatusSpy).not.toHaveBeenCalled();
    expect(autodetectButton).toBeInTheDocument();

    fireEvent.click(autodetectButton);
    expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
  });
});
