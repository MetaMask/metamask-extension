import React from 'react';
import { color, number, select } from '@storybook/addon-knobs';
import { SEVERITIES } from '../../../helpers/constants/design-system';
import README from './README.mdx';
import ApproveIcon from './approve-icon.component';
import CopyIcon from './copy-icon.component';
import InteractionIcon from './interaction-icon.component';
import PreloaderIcon from './preloader';
import ReceiveIcon from './receive-icon.component';
import SendIcon from './send-icon.component';
import InfoIcon from './info-icon.component';
import InfoIconInverted from './info-icon-inverted.component';
import PaperAirplaneIcon from './paper-airplane-icon';

export default {
  title: 'Components/UI/Icon',
  id: __filename,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    severity: {
      control: 'select',
      options: ['warning', 'info', 'danger', 'success'],
    },
    size: { control: 'number' },
    color: { control: 'color' },
  },
};

export const Copy = (args) => <CopyIcon {...args} />;
Copy.args = {
  size: 40,
  color: '#2F80ED',
};

export const Send = (args) => <SendIcon {...args} />;
Send.args = {
  size: 40,
  color: '#2F80ED',
};

export const Receive = (args) => <ReceiveIcon {...args} />;
Receive.args = {
  size: 40,
  color: '#2F80ED',
};

export const SiteInteraction = () => (
  <InteractionIcon
    size={number('size', 40)}
    color={color('color', '#2F80ED')}
  />
);

export const ApproveSpendLimit = (args) => <ApproveIcon {...args} />;

ApproveSpendLimit.args = {
  size: 40,
  color: '#2F80ED',
};

export const Preloader = (args) => <PreloaderIcon {...args} />;
Preloader.args = {
  size: 40,
};

export const PaperAirplane = (args) => <PaperAirplaneIcon {...args} />;
PaperAirplane.args = {
  size: 40,
  color: '#2F80ED',
};

export const Info = (args) => <InfoIcon {...args} />;
Info.args = {
  size: 40,
  severity: SEVERITIES.INFO,
};

export const InfoInverted = (args) => <InfoIconInverted {...args} />;

InfoInverted.args = {
  severity: SEVERITIES.INFO,
  size: 40,
};
