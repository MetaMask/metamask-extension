import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { MOCK_ETHEREUM_HARDWARE_ADDRESS } from '../../../../test/data/hardware-wallet-accounts';
import { HardwareAccountAddressRow } from './hardware-account-address-row';

export default {
  title: 'Components/MultichainAccounts/HardwareAccountAddressRow',
  component: HardwareAccountAddressRow,
  args: {
    address: MOCK_ETHEREUM_HARDWARE_ADDRESS,
  },
} as Meta<typeof HardwareAccountAddressRow>;

export const DefaultStory: StoryFn<typeof HardwareAccountAddressRow> = (
  args,
) => <HardwareAccountAddressRow {...args} />;

DefaultStory.storyName = 'Default';

export const WithAddressType: StoryFn<typeof HardwareAccountAddressRow> = (
  args,
) => (
  <HardwareAccountAddressRow
    {...args}
    address={{
      ...MOCK_ETHEREUM_HARDWARE_ADDRESS,
      id: 'btc-0',
      networkName: 'Bitcoin',
      address: 'bc1qea1234567890abcdefghijklmnopqrstuvwer2fx',
      iconUrl: './images/bitcoin-logo.svg',
      addressType: 'Taproot',
    }}
  />
);
