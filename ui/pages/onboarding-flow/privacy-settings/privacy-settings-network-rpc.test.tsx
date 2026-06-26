import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import PrivacySettingsNetworkRpc from './privacy-settings-network-rpc';

const createStore = (...networks: Parameters<typeof mockNetworkState>) =>
  configureMockStore([thunk])({
    metamask: {
      ...mockNetworkState(...networks),
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
    },
  });

const defaultNetworks = [
  { chainId: CHAIN_IDS.MAINNET },
  { chainId: CHAIN_IDS.LINEA_MAINNET },
  { chainId: CHAIN_IDS.SEPOLIA },
  { chainId: CHAIN_IDS.LINEA_SEPOLIA },
] as const;

const renderNetworkRpc = (store = createStore(...defaultNetworks)) =>
  renderWithProvider(<PrivacySettingsNetworkRpc />, store);

describe('PrivacySettingsNetworkRpc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the network RPC page content', () => {
    renderNetworkRpc();

    expect(
      screen.getByTestId('privacy-settings-network-rpc'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.onboardingAdvancedPrivacyNetworkTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: messages.privacyMsg.message }),
    ).toHaveAttribute('href', 'https://consensys.io/privacy-policy/');
    expect(
      screen.getByRole('link', {
        name: messages.onboardingAdvancedPrivacyNetworkDescriptionCallToAction
          .message,
      }),
    ).toHaveAttribute('href', ZENDESK_URLS.ADD_SOLANA_ACCOUNTS);
    expect(
      screen.getByTestId('onboarding-network-rpc-add-custom-network-button'),
    ).toHaveTextContent(messages.addACustomNetwork.message);
  });

  it('renders non-test networks and hides test networks', () => {
    renderNetworkRpc();

    expect(
      screen.getByTestId(`network-list-item-${CHAIN_IDS.MAINNET}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`network-list-item-${CHAIN_IDS.LINEA_MAINNET}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`network-list-item-${CHAIN_IDS.SEPOLIA}`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`network-list-item-${CHAIN_IDS.LINEA_SEPOLIA}`),
    ).not.toBeInTheDocument();
  });

  it('opens the network edit menu when clicking a network row', () => {
    const store = createStore(...defaultNetworks);

    renderNetworkRpc(store);

    fireEvent.click(
      screen.getByTestId(`network-list-item-${CHAIN_IDS.MAINNET}`),
    );

    expect(store.getActions()).toContainEqual({
      type: 'SET_EDIT_NETWORK',
      payload: { chainId: CHAIN_IDS.MAINNET },
    });
    expect(store.getActions()).toContainEqual({
      type: 'TOGGLE_NETWORK_MENU',
      payload: undefined,
    });
  });

  it('opens the network edit menu when clicking the RPC URL', () => {
    const store = createStore(...defaultNetworks);

    renderNetworkRpc(store);

    fireEvent.click(
      screen.getByTestId(`network-rpc-name-button-${CHAIN_IDS.MAINNET}`),
    );

    expect(store.getActions()).toContainEqual({
      type: 'SET_EDIT_NETWORK',
      payload: { chainId: CHAIN_IDS.MAINNET },
    });
    expect(store.getActions()).toContainEqual({
      type: 'TOGGLE_NETWORK_MENU',
      payload: undefined,
    });
  });

  it('opens add custom network from the add network button', () => {
    const store = createStore(...defaultNetworks);

    renderNetworkRpc(store);

    fireEvent.click(
      screen.getByTestId('onboarding-network-rpc-add-custom-network-button'),
    );

    expect(store.getActions()).toContainEqual({
      type: 'TOGGLE_NETWORK_MENU',
      payload: {
        isAddingNewNetwork: true,
        isMultiRpcOnboarding: true,
      },
    });
  });
});
