import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import { LEDGER_HD_PATHS } from '../utils/hardware-hd-paths';
import {
  createMockRawHardwareAccounts,
  MOCK_RAW_HARDWARE_ACCOUNTS,
} from '../../../../../test/unit/hardware-wallets/connect-hardware/raw-hardware-accounts';
import { SelectHardwareAccountsPage } from './select-hardware-accounts-page';
import type { SelectHardwareAccountsPageProps } from './select-hardware-accounts-page.types';

const mockMetaMetricsContext = {
  trackEvent: () => Promise.resolve(),
  bufferedTrace: () => Promise.resolve(undefined),
  bufferedEndTrace: () => undefined,
  onboardingParentContext: { current: null },
};

const mockStore = configureMockStore([])({
  appState: {
    defaultHdPaths: {
      [HardwareDeviceNames.ledger]: LEDGER_HD_PATHS[0].value,
    },
  },
  metamask: {
    keyrings: [],
    internalAccounts: {
      accounts: {},
      selectedAccount: 'accountId',
    },
  },
});

type StoryArgs = Omit<SelectHardwareAccountsPageProps, 'onBack' | 'onError'>;

const toConnectAccounts = (
  accounts: typeof MOCK_RAW_HARDWARE_ACCOUNTS,
): SelectHardwareAccountsPageProps['accounts'] =>
  accounts.map((account) => ({
    ...account,
    balance: '...',
  }));

const SelectHardwareAccountsPageStory = (args: StoryArgs) => (
  <Provider store={mockStore}>
    <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
      <SelectHardwareAccountsPage
        {...args}
        onBack={() => undefined}
        onError={() => undefined}
      />
    </MetaMetricsContext.Provider>
  </Provider>
);

export default {
  title: 'Pages/CreateAccount/ConnectHardware/SelectHardwareAccountsPage',
  component: SelectHardwareAccountsPage,
  decorators: [
    (Story: StoryFn) => (
      <div style={{ width: '460px', minHeight: '800px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onBack: { action: 'onBack' },
    onError: { action: 'onError' },
  },
  args: {
    device: HardwareDeviceNames.ledger,
    accounts: toConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 2)),
    connectedAccounts: [],
  },
} as Meta<typeof SelectHardwareAccountsPage>;

export const DefaultStory: StoryFn<typeof SelectHardwareAccountsPage> = (
  args,
) => <SelectHardwareAccountsPageStory {...args} />;

DefaultStory.storyName = 'Default';

export const WithShowMore: StoryFn<typeof SelectHardwareAccountsPage> = (
  args,
) => (
  <SelectHardwareAccountsPageStory
    {...args}
    accounts={toConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS)}
  />
);

WithShowMore.storyName = 'With Show More Pagination';

export const WithAlreadyConnectedAccount: StoryFn<
  typeof SelectHardwareAccountsPage
> = (args) => (
  <SelectHardwareAccountsPageStory
    {...args}
    accounts={toConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 2))}
    connectedAccounts={[MOCK_RAW_HARDWARE_ACCOUNTS[1].address.toLowerCase()]}
  />
);

export const WithoutSettingsButton: StoryFn<
  typeof SelectHardwareAccountsPage
> = (args) => (
  <SelectHardwareAccountsPageStory
    {...args}
    device={HardwareDeviceNames.qr}
    accounts={toConnectAccounts(createMockRawHardwareAccounts(2))}
  />
);

export const FullscreenLayout: StoryFn<typeof SelectHardwareAccountsPage> = (
  args,
) => (
  <div style={{ width: '100%', minHeight: '100vh' }}>
    <SelectHardwareAccountsPageStory {...args} />
  </div>
);

FullscreenLayout.decorators = [];
