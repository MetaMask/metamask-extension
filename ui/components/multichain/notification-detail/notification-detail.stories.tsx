import React from 'react';
import { Meta } from '@storybook/react';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { AvatarAccount, Text } from '../../component-library';
import {
  NotificationDetail,
  NotificationDetailProps,
} from './notification-detail';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetail',
  component: NotificationDetail,
  argTypes: {
    icon: { control: 'object' },
    primaryTextLeft: { control: 'object' },
    primaryTextRight: { control: 'object' },
    secondaryTextLeft: { control: 'object' },
    secondaryTextRight: { control: 'object' },
  },
} as Meta;

const Template = (args: NotificationDetailProps) => (
  <NotificationDetail {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  icon: <AvatarAccount address="0x7830c87C02e56AFf27FA8Ab1241711331FA86F43" />,
  primaryTextLeft: (
    <Text
      variant={TextVariant.bodyLgMedium}
      fontWeight={FontWeight.Medium}
      color={TextColor.textDefault}
    >
      Primary Text Left
    </Text>
  ),
  primaryTextRight: (
    <Text
      variant={TextVariant.bodyLgMedium}
      fontWeight={FontWeight.Medium}
      color={TextColor.textDefault}
    >
      Primary Text Right
    </Text>
  ),
  secondaryTextLeft: (
    <Text
      variant={TextVariant.bodyMd}
      fontWeight={FontWeight.Normal}
      color={TextColor.textAlternative}
    >
      Secondary Text Left
    </Text>
  ),
  secondaryTextRight: (
    <Text
      variant={TextVariant.bodyMd}
      fontWeight={FontWeight.Normal}
      color={TextColor.textAlternative}
    >
      Secondary Text Right
    </Text>
  ),
};
