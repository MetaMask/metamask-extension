import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationDetailNft,
  NotificationDetailNftProps,
} from './notification-detail-nft';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailNft',
  component: NotificationDetailNft,
} as Meta;

const Template = (args: NotificationDetailNftProps) => (
  <NotificationDetailNft {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  tokenSrc:
    'https://i.seadn.io/s/raw/files/a96f90ec8ebf55a2300c66a0c46d6a16.png?w=500&auto=format',
  networkSrc:
    'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
  tokenId: 'NFT ID',
  tokenName: 'NFT Name',
  networkName: 'Ethereum',
};
