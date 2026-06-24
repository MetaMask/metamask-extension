import React, { useMemo, useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { createMockHardwareAccounts } from '../../../../../test/data/hardware-wallet-accounts';
import { SelectHardwareAccountsPage } from './select-hardware-accounts-page';
import type { SelectHardwareAccountsPageProps } from './select-hardware-accounts-page.types';

const FIGMA_DEFAULT_ACCOUNTS = createMockHardwareAccounts(2, {
  includeMultichainAddresses: true,
});

const SelectHardwareAccountsPageStory = (
  args: SelectHardwareAccountsPageProps,
) => {
  const [selectedAccountIds, setSelectedAccountIds] = useState(
    args.selectedAccountIds,
  );

  return (
    <SelectHardwareAccountsPage
      {...args}
      selectedAccountIds={selectedAccountIds}
      onAccountSelectionChange={setSelectedAccountIds}
    />
  );
};

const SelectHardwareAccountsPageWithPaginationStory = (
  args: Omit<SelectHardwareAccountsPageProps, 'accounts' | 'hasMoreAccounts'>,
) => {
  const allAccounts = useMemo(
    () =>
      createMockHardwareAccounts(10, {
        includeMultichainAddresses: true,
      }),
    [],
  );
  const [visibleAccountCount, setVisibleAccountCount] = useState(2);
  const [selectedAccountIds, setSelectedAccountIds] = useState(
    args.selectedAccountIds,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const accounts = allAccounts.slice(0, visibleAccountCount);
  const hasMoreAccounts = visibleAccountCount < allAccounts.length;

  const handleShowMore = () => {
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setVisibleAccountCount((currentCount) =>
        Math.min(currentCount + 5, allAccounts.length),
      );
      setIsLoadingMore(false);
    }, 600);
  };

  return (
    <SelectHardwareAccountsPage
      {...args}
      accounts={accounts}
      selectedAccountIds={selectedAccountIds}
      onAccountSelectionChange={setSelectedAccountIds}
      hasMoreAccounts={hasMoreAccounts}
      isLoadingMore={isLoadingMore}
      onShowMore={handleShowMore}
    />
  );
};

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
    onShowMore: { action: 'onShowMore' },
    onContinue: { action: 'onContinue' },
    onForgetDevice: { action: 'onForgetDevice' },
    onSettingsClick: { action: 'onSettingsClick' },
    onAccountSelectionChange: { action: 'onAccountSelectionChange' },
  },
  args: {
    accounts: FIGMA_DEFAULT_ACCOUNTS,
    selectedAccountIds: ['account-0'],
    hasMoreAccounts: true,
    isLoadingMore: false,
    showSettingsButton: true,
  },
} as Meta<typeof SelectHardwareAccountsPage>;

export const DefaultStory: StoryFn<typeof SelectHardwareAccountsPage> = (
  args,
) => <SelectHardwareAccountsPageStory {...args} />;

DefaultStory.storyName = 'Default';

export const WithShowMore: StoryFn<typeof SelectHardwareAccountsPage> = (
  args,
) => <SelectHardwareAccountsPageWithPaginationStory {...args} />;

WithShowMore.storyName = 'With Show More Pagination';

export const EthereumOnlyAccounts: StoryFn<
  typeof SelectHardwareAccountsPage
> = (args) => (
  <SelectHardwareAccountsPageStory
    {...args}
    accounts={createMockHardwareAccounts(2, {
      includeMultichainAddresses: false,
    })}
    selectedAccountIds={[]}
    hasMoreAccounts={true}
  />
);

export const MultichainAccounts: StoryFn<typeof SelectHardwareAccountsPage> = (
  args,
) => (
  <SelectHardwareAccountsPageStory
    {...args}
    accounts={createMockHardwareAccounts(3, {
      includeMultichainAddresses: true,
    })}
    selectedAccountIds={['account-0', 'account-1']}
    hasMoreAccounts={true}
  />
);

export const WithAlreadyConnectedAccount: StoryFn<
  typeof SelectHardwareAccountsPage
> = (args) => {
  const accounts = createMockHardwareAccounts(2, {
    includeMultichainAddresses: true,
  }).map((account, index) =>
    index === 1 ? { ...account, isAlreadyConnected: true } : account,
  );

  return (
    <SelectHardwareAccountsPageStory
      {...args}
      accounts={accounts}
      selectedAccountIds={['account-0']}
      hasMoreAccounts={true}
    />
  );
};

export const LoadingMoreAccounts: StoryFn<typeof SelectHardwareAccountsPage> = (
  args,
) => (
  <SelectHardwareAccountsPageStory
    {...args}
    accounts={FIGMA_DEFAULT_ACCOUNTS}
    hasMoreAccounts={true}
    isLoadingMore={true}
  />
);

export const WithoutSettingsButton: StoryFn<
  typeof SelectHardwareAccountsPage
> = (args) => (
  <SelectHardwareAccountsPageStory
    {...args}
    showSettingsButton={false}
    onSettingsClick={undefined}
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
