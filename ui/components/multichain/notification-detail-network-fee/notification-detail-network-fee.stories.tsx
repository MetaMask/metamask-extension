import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationDetailNetworkFee,
  NotificationDetailNetworkFeeProps,
} from './notification-detail-network-fee';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailNetworkFee',
  component: NotificationDetailNetworkFee,
} as Meta;

const Template = (args: NotificationDetailNetworkFeeProps) => (
  <NotificationDetailNetworkFee {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  networkFee: '0.00039275 ETH ($0.62)',
  gasLimit: '21000',
  gasUsed: '21000',
  baseFee: '17.202502617',
  priorityFee: '1.5',
  maxFee: '1.5 (0.00000003 ETH)',
};
