import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import {
  createHardwareWalletAccount,
  createMockHardwareAccounts,
} from '../../../../test/data/hardware-wallet-accounts';
import { HardwareAccountCard } from './hardware-account-card';
import type { HardwareAccountCardProps } from './hardware-account-card.types';

const account = createMockHardwareAccounts(1, {
  includeMultichainAddresses: true,
})[0];

type HardwareAccountCardStoryProps = Omit<
  HardwareAccountCardProps,
  'isSelected' | 'onToggleSelection'
> & {
  initialSelected?: boolean;
};

const HardwareAccountCardStory = ({
  initialSelected = false,
  account: accountProp,
}: HardwareAccountCardStoryProps) => {
  const [isSelected, setIsSelected] = useState(initialSelected);

  return (
    <HardwareAccountCard
      account={accountProp}
      isSelected={isSelected}
      onToggleSelection={() => {
        setIsSelected((previousValue) => !previousValue);
      }}
    />
  );
};

export default {
  title: 'Components/MultichainAccounts/HardwareAccountCard',
  component: HardwareAccountCard,
  args: {
    account,
    initialSelected: true,
  },
} as Meta<HardwareAccountCardStoryProps>;

export const DefaultStory: StoryFn<HardwareAccountCardStoryProps> = (args) => (
  <HardwareAccountCardStory {...args} />
);

DefaultStory.storyName = 'Default';

export const Unchecked: StoryFn<HardwareAccountCardStoryProps> = (args) => (
  <HardwareAccountCardStory {...args} initialSelected={false} />
);

export const EthereumOnly: StoryFn<HardwareAccountCardStoryProps> = (args) => (
  <HardwareAccountCardStory {...args} account={createHardwareWalletAccount()} />
);

export const AlreadyConnected: StoryFn<HardwareAccountCardStoryProps> = (
  args,
) => (
  <HardwareAccountCard
    {...args}
    account={{ ...account, isAlreadyConnected: true }}
    isSelected={false}
    onToggleSelection={() => undefined}
  />
);
