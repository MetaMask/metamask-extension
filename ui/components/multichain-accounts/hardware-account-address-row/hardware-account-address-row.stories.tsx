import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { ETH_TOKEN_IMAGE_URL } from '../../../../shared/constants/network';
import { HardwareAccountAddressRow } from './hardware-account-address-row';
import type { HardwareWalletAccountAddress } from './hardware-account-address-row.types';

const baseAddress: HardwareWalletAccountAddress = {
  id: 'eth-0',
  networkName: 'Ethereum',
  address: '0x091234567890123456789012345678901234b272',
  balance: '$120.00',
  iconUrl: ETH_TOKEN_IMAGE_URL,
  iconType: 'network',
};

export default {
  title: 'Components/MultichainAccounts/HardwareAccountAddressRow',
  component: HardwareAccountAddressRow,
  args: {
    address: baseAddress,
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
      ...baseAddress,
      networkName: 'Bitcoin',
      address: 'bc1qea1234567890abcdefghijklmnopqrstuvwer2fx',
      iconUrl: './images/bitcoin-logo.svg',
      iconType: 'token',
      addressType: 'Taproot',
    }}
  />
);
