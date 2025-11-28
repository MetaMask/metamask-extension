import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import type { NetworkConfiguration } from '@metamask/network-controller';
import { fireEvent } from '../../../../../../test/jest';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import * as actions from '../../../../../store/actions';
import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';
import { createMockInternalAccount } from '../../../../../../test/jest/mocks';
import AssetListControlBar from './asset-list-control-bar';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const createMockState = () => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
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
    } as unknown as Record<string, NetworkConfiguration>,
    multichainNetworkConfigurationsByChainId:
      AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
    selectedMultichainNetworkChainId: 'eip155:1',
    isEvmSelected: true,
    useNftDetection: true,
    internalAccounts: {
      selectedAccount: 'selectedAccount',
      accounts: {
        selectedAccount: createMockInternalAccount(),
      },
    },
  },
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

    const state = createMockState();
    const store = configureMockStore([thunk])(state);

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
