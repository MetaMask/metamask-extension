import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationDetailAsset,
  NotificationDetailAssetProps,
} from './notification-detail-asset';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailAsset',
  component: NotificationDetailAsset,
} as Meta;

const Template = (args: NotificationDetailAssetProps) => (
  <NotificationDetailAsset {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  icon: {
    src: 'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
    badge: {
      src: 'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
    },
  },
  label: 'This is the label',
  detail: 'This is a line detail',
  fiatValue: '500$',
  value: '0.5 ETH',
};

export const NoValueStory = Template.bind({});
NoValueStory.args = {
  icon: {
    src: 'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
    badge: {
      src: 'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
    },
  },
  label: 'This is the label',
  detail: 'This is a line detail',
  fiatValue: '500$',
};
