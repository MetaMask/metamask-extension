import React from 'react';
import { Meta } from '@storybook/react';
import { BadgeWrapperPosition, IconName } from '../../component-library';
import { NotificationListItemIconType } from '../notification-list-item-icon/notification-list-item-icon';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import type { NotificationListItemProps } from './notification-list-item';
import { NotificationListItem } from './notification-list-item';

export default {
  title:
    'Components/Multichain/Notification/NotificationListItem/NotificationListItem',
  component: NotificationListItem,
} as Meta;

const Template = (args: NotificationListItemProps) => (
  <NotificationListItem {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  id: '1',
  isRead: false,
  icon: {
    type: NotificationListItemIconType.Token,
    value:
      'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
    badge: {
      icon: IconName.Bridge,
      position: BadgeWrapperPosition.bottomRight,
    },
  },
  title: {
    items: [
      {
        text: 'Lorem ipsum',
      },
      {
        text: 'dolor sit amet',
        highlighted: true,
      },
    ],
    color: TextColor.textAlternative,
  },
  description: {
    items: [
      {
        text: 'Lorem Ipsum is simply dummy text of the printing and',
      },
      {
        text: 'typesetting industry',
        highlighted: true,
      },
    ],
    variant: TextVariant.bodyMd,
  },
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  amount: '1000000000',
};

export const SnapNotification = Template.bind({});
SnapNotification.args = {
  id: '1',
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  description: {
    items: [
      { text: 'vitalik.eth', highlighted: true },
      { text: 'is about to expire' },
    ],
    variant: TextVariant.bodyMd,
  },
  icon: {
    type: NotificationListItemIconType.Token,
    value: 'https://s2.coinmarketcap.com/static/img/coins/64x64/13855.png',
  },
  title: {
    items: [
      {
        text: 'Ethereum Name Service',
      },
    ],
  },
};

export const FeatureAnnouncementNotification = Template.bind({});
FeatureAnnouncementNotification.args = {
  id: '1',
  isRead: true,
  createdAt: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000),
  description: {
    items: [{ text: 'You can now cash out crypto on Metamask Portfolio' }],
    variant: TextVariant.bodyMd,
  },
  icon: {
    type: NotificationListItemIconType.Token,
    value:
      'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  },
  title: {
    items: [
      {
        text: 'Introducing Cash Out',
      },
    ],
  },
};

export const NftSentNotification = Template.bind({});
NftSentNotification.args = {
  id: '1',
  isRead: true,
  createdAt: new Date('January 1, 1970'),
  description: {
    items: [{ text: 'Collection Name' }],
    variant: TextVariant.bodyMd,
  },
  icon: {
    type: NotificationListItemIconType.Nft,
    value:
      'https://i.seadn.io/gcs/files/4577987a5ca45ca5118b2e31559ee4d1.jpg?w=500&auto=format',
    badge: {
      icon: IconName.Arrow2UpRight,
    },
  },
  title: {
    items: [
      {
        text: 'Sent NFT to',
      },
      {
        text: '0xe983b...3114',
        highlighted: true,
      },
    ],
  },
  amount: '#1234',
};
