import React from 'react';
import { Provider } from 'react-redux';
import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { NetworkPillSelector } from './network-pill-selector';

const MAINNET_ETH = 'eip155:1/slip44:60';
const POLYGON_POL = 'eip155:137/slip44:966';

// The account in the selected account group of `mock-state.json`.
const ACCOUNT_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

const ALL_DEFAULT_NETWORKS_ENABLED = {
  eip155: {
    '0x1': true,
    '0x38': true,
    '0x89': true,
    '0xa4b1': true,
  },
};

type MetaMaskStateOverrides = Partial<typeof mockState.metamask> &
  Record<string, unknown>;

/**
 * Builds a store from `mock-state.json`, with fiat balances on Ethereum and
 * Polygon so that the pills have something to show.
 *
 * @param overrides - Extra `metamask` state for the story.
 */
const createStore = (overrides: MetaMaskStateOverrides = {}) =>
  configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices: true,
      enabledNetworkMap: ALL_DEFAULT_NETWORKS_ENABLED,
      networkConfigurationsByChainId: {
        ...mockState.metamask.networkConfigurationsByChainId,
        '0x1': {
          ...mockState.metamask.networkConfigurationsByChainId['0x1'],
          name: 'Ethereum',
        },
      },
      assetsInfo: {
        ...mockState.metamask.assetsInfo,
        [POLYGON_POL]: { type: 'native', decimals: 18, symbol: 'POL' },
      },
      assetsBalance: {
        [ACCOUNT_ID]: {
          [MAINNET_ETH]: { amount: '2' },
          [POLYGON_POL]: { amount: '1000' },
        },
      },
      assetsPrice: {
        ...mockState.metamask.assetsPrice,
        [POLYGON_POL]: {
          assetPriceType: 'fungible',
          price: 0.5,
          usdPrice: 0.5,
          lastUpdated: 1721393858000,
        },
      },
      ...overrides,
    },
  } as Parameters<typeof configureStore>[0]);

/**
 * Renders the story in a Redux store built from `mock-state.json`.
 *
 * @param overrides - Extra `metamask` state for the story.
 */
const withStore =
  (overrides?: MetaMaskStateOverrides): Decorator =>
  (Story) => (
    <Provider store={createStore(overrides)}>
      <Story />
    </Provider>
  );

const meta: Meta<typeof NetworkPillSelector> = {
  title: 'Components/App/Assets/NetworkPillSelector',
  component: NetworkPillSelector,
  parameters: {
    docs: {
      description: {
        component: [
          'Network selector for the fullscreen design. It takes no props: everything comes from the Redux store.',
          '',
          '- **Which pills, and their state:** `useHomeNetworkFilter` (the hook behind the home network filter dropdown) returns the default networks for the selected account group, which one is selected (`enabledNetworkMap`) and which are disabled (non-EVM networks for an EVM-only account group). Clicking a pill uses the same handlers as the dropdown.',
          '- **Balances:** `useNetworkPillBalances` computes the selected account group balance, in the user currency, for each network and for all of them together (the "All default networks" pill), from `assetsBalance`, `assetsPrice` and `assetsInfo` using `selectUnifiedBalanceGetterBySelectedAccountGroup`. It is the calculation used by the wallet overview balance.',
          '',
          'The stories use `test/data/mock-state.json` with fiat balances on Ethereum and Polygon.',
        ].join('\n'),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkPillSelector>;

export const Default: Story = {
  decorators: [withStore()],
};

export const SingleNetworkSelected: Story = {
  decorators: [withStore({ enabledNetworkMap: { eip155: { '0x1': true } } })],
};

export const PrivacyMode: Story = {
  decorators: [
    withStore({
      preferences: { ...mockState.metamask.preferences, privacyMode: true },
    }),
  ],
};
