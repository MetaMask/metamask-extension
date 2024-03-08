import React from 'react';
import { Meta } from '@storybook/react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { shortenAddress } from '../../../helpers/utils/util';
import {
  NotificationDetailCopyButton,
  NotificationDetailCopyButtonProps,
} from './notification-detail-copy-button';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailCopyButton',
  component: NotificationDetailCopyButton,
} as Meta;

const Template = (args: NotificationDetailCopyButtonProps) => (
  <NotificationDetailCopyButton {...args} />
);

export const DefaultStory = Template.bind({});
const address = '0x7830c87C02e56AFf27FA8Ab1241711331FA86F43';
const checksummedAddress = toChecksumHexAddress(address);
const displayAddress = shortenAddress(checksummedAddress);
DefaultStory.args = {
  text: address,
  displayText: displayAddress,
};
