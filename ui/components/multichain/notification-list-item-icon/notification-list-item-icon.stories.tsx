import React from 'react';
import { Meta } from '@storybook/react';
import { BadgeWrapperPosition, IconName } from '../../component-library';
import {
  NotificationListItemIcon,
  NotificationListItemIconProps,
  NotificationListItemIconType,
} from './notification-list-item-icon';

export default {
  title:
    'Components/Multichain/Notification/NotificationListItem/Components/NotificationListItemIcon',
  component: NotificationListItemIcon,
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: Object.values(NotificationListItemIconType),
      },
    },
    value: { control: 'text' },
  },
} as Meta;

const Template = (args: NotificationListItemIconProps) => (
  <NotificationListItemIcon {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  type: NotificationListItemIconType.Token,
  value: 'http://foo.com/bar.png',
  badge: {
    icon: IconName.Ethereum,
    position: BadgeWrapperPosition.bottomRight,
  },
};

export const TokenIconStory = Template.bind({});
TokenIconStory.args = {
  type: NotificationListItemIconType.Token,
  value:
    'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
  badge: {
    icon: IconName.Bridge,
    position: BadgeWrapperPosition.bottomRight,
  },
};

export const TokenIconStoryTopBadge = Template.bind({});
TokenIconStoryTopBadge.args = {
  type: NotificationListItemIconType.Token,
  value:
    'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
  badge: {
    icon: IconName.SwapHorizontal,
    position: BadgeWrapperPosition.topRight,
  },
};

export const NftIconStory = Template.bind({});
NftIconStory.args = {
  type: NotificationListItemIconType.Nft,
  value:
    'https://i.seadn.io/gcs/files/4577987a5ca45ca5118b2e31559ee4d1.jpg?w=500&auto=format',
  badge: {
    icon: IconName.Arrow2UpRight,
    position: BadgeWrapperPosition.bottomRight,
  },
};

export const NftIconWithoutImageStory = Template.bind({});
NftIconWithoutImageStory.args = {
  type: NotificationListItemIconType.Nft,
  value: 'https://i.seadn.io/gcs/files/foobar.jpg',
  badge: {
    icon: IconName.Arrow2UpRight,
    position: BadgeWrapperPosition.bottomRight,
  },
};
