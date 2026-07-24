import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import Home from './home';
import testData from '../../../.storybook/test-data';
import configureStore from '../../store/store';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { AccountOverviewTabKey } from '../../../shared/constants/app-state';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import { RouteMessengerContext } from '../../contexts/route-messenger';

const routeMessenger = createMockRouteMessenger();

type HomeStoryStateOverrides = {
  metamask?: Record<string, unknown>;
  appState?: Record<string, unknown>;
};

/**
 * Mirrors the old Home story args as Redux state so home modals stay hidden.
 */
function createHomeStoryStore(overrides: HomeStoryStateOverrides = {}) {
  return configureStore({
    ...testData,
    metamask: {
      ...testData.metamask,
      completedOnboarding: true,
      firstTimeFlowType: FirstTimeFlowType.import,
      termsOfUseLastAgreed: Date.now(),
      dataCollectionForMarketing: false,
      useExternalServices: true,
      recoveryPhraseReminderHasBeenShown: true,
      recoveryPhraseReminderLastShown: Date.now(),
      forgottenPassword: false,
      preferences: {
        ...testData.metamask.preferences,
        showMultiRpcModal: false,
      },
      ...overrides.metamask,
    },
    appState: {
      ...testData.appState,
      onboardedInThisUISession: false,
      showUpdateModal: false,
      newNetworkAddedConfigurationId: '',
      ...overrides.appState,
    },
  });
}

const meta: Meta<typeof Home> = {
  title: 'Pages/Home/Home',
  component: Home,
  decorators: [
    (Story) => (
      <RouteMessengerContext.Provider value={routeMessenger}>
        <Provider store={createHomeStoryStore()}>
          <div className="-m-4">
            <Story />
          </div>
        </Provider>
      </RouteMessengerContext.Provider>
    ),
  ],
  parameters: {
    initialEntries: ['/'],
    path: '*',
  },
};

export default meta;
type Story = StoryObj<typeof Home>;

export const Default: Story = {};

export const ForgottenPassword: Story = {
  decorators: [
    (Story) => (
      <Provider
        store={createHomeStoryStore({
          metamask: { forgottenPassword: true },
        })}
      >
        <div className="-m-4">
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export const NFTNotifications: Story = {
  decorators: [
    (Story) => (
      <Provider
        store={createHomeStoryStore({
          metamask: {
            newTokensImported: '5',
            newTokensImportedError: 'Failed to import some tokens',
            newNetworkAddedName: 'Arbitrum One',
            defaultHomeActiveTabName: AccountOverviewTabKey.Nfts,
          },
        })}
      >
        <div className="-m-4">
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export const NewNetworkAdded: Story = {
  decorators: [
    (Story) => (
      <Provider
        store={createHomeStoryStore({
          metamask: {
            newNetworkAddedName: 'Arbitrum One',
          },
          appState: {
            newNetworkAddedConfigurationId: '1',
          },
        })}
      >
        <div className="-m-4">
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export const UpdateLatestVersion: Story = {
  decorators: [
    (Story) => (
      <Provider
        store={createHomeStoryStore({
          metamask: {
            pendingExtensionVersion: '99.0.0',
            lastUpdatedAt: 0,
            updateModalLastDismissedAt: 0,
          },
        })}
      >
        <div className="-m-4">
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export const ProtectYourWallet: Story = {
  decorators: [
    (Story) => (
      <Provider
        store={createHomeStoryStore({
          metamask: {
            firstTimeFlowType: FirstTimeFlowType.create,
            recoveryPhraseReminderHasBeenShown: false,
            recoveryPhraseReminderLastShown: 0,
            seedPhraseBackedUp: false,
          },
        })}
      >
        <div className="-m-4">
          <Story />
        </div>
      </Provider>
    ),
  ],
};
