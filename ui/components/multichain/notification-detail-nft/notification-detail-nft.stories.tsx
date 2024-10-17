import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationDetailNft,
  NotificationDetailNftProps,
} from './notification-detail-nft';
import { TokenStandard } from '../../../../shared/constants/transaction';

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
  nft: {
    address: '0xAddress',
    chainId: '0x1',
    image:
      'https://i.seadn.io/s/raw/files/a96f90ec8ebf55a2300c66a0c46d6a16.png?w=500&auto=format',
    name: 'NFT Name',
    standard: TokenStandard.ERC1155,
    tokenId: 'NFT ID',
  },
};
