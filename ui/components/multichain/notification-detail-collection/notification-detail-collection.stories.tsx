import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationDetailCollection,
  NotificationDetailCollectionProps,
} from './notification-detail-collection';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailCollection',
  component: NotificationDetailCollection,
} as Meta;

const Template = (args: NotificationDetailCollectionProps) => (
  <NotificationDetailCollection {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  icon: {
    src: 'https://i.seadn.io/gcs/files/0d5f1b200a067938f507cbe12bbbabc2.jpg?w=500&auto=format',
    badgeSrc:
      'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
  },
  label: 'Collection',
  collection: 'Pixel Birds (#211)',
};
