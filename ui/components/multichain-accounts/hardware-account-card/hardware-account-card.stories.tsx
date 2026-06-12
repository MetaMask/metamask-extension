import React, { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { ETH_TOKEN_IMAGE_URL } from '../../../../shared/constants/network';
import { HardwareAccountCard } from './hardware-account-card';
import type {
  HardwareAccountCardProps,
  HardwareWalletAccount,
} from './hardware-account-card.types';

const account: HardwareWalletAccount = {
  id: 'account-0',
  name: 'Account 1',
  totalBalance: '$360.00',
  addresses: [
    {
      id: 'eth-0',
      networkName: 'Ethereum',
      address: '0x091234567890123456789012345678901234b272',
      balance: '$120.00',
      iconUrl: ETH_TOKEN_IMAGE_URL,
      iconType: 'network',
    },
    {
      id: 'sol-0',
      networkName: 'Solana',
      address: '6dk7RD1234567890abcdefghijklmnopqrstuvDEtXQ',
      balance: '$120.00',
      iconUrl: './images/solana-logo.svg',
      iconType: 'network',
    },
    {
      id: 'btc-0',
      networkName: 'Bitcoin',
      address: 'bc1qea1234567890abcdefghijklmnopqrstuvwer2fx',
      balance: '$120.00',
      iconUrl: './images/bitcoin-logo.svg',
      iconType: 'token',
      addressType: 'Taproot',
    },
  ],
};

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
  <HardwareAccountCardStory
    {...args}
    account={{
      ...account,
      totalBalance: '$120.00',
      addresses: [account.addresses[0]],
    }}
  />
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
