import React from 'react';
import { Meta } from '@storybook/react';
import {
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { NotificationDetailCopyButton } from '../notification-detail-copy-button';
import {
  NotificationDetailInfo,
  NotificationDetailInfoProps,
} from './notification-detail-info';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailInfo',
  component: NotificationDetailInfo,
} as Meta;

const Template = (args: NotificationDetailInfoProps) => (
  <NotificationDetailInfo {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  icon: {
    iconName: 'check',
    color: TextColor.successDefault,
    backgroundColor: BackgroundColor.successMuted,
  },
  label: 'This is the label',
  detail: 'This is a line detail',
};

export const WithAnActionStory = Template.bind({});
WithAnActionStory.args = {
  icon: {
    iconName: 'check',
    color: TextColor.successDefault,
    backgroundColor: BackgroundColor.successMuted,
  },
  label: 'This is the label',
  detail: 'This is a line detail',
  action: (
    <NotificationDetailCopyButton
      text="0x50c8694b0e00f801ac2941ce7743633e43e6252518243f4fbc6c1e605166525c"
      displayText="Action Text"
      color={TextColor.primaryDefault}
    />
  ),
};
