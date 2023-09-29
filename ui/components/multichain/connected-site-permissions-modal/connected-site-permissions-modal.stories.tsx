import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ConnectedSitePermissionsModal } from '.';

interface ConnectedSitePermissionsModalProps {
  onClose: () => void;
  siteName: string;
  siteIcon: string;
}

export default {
  title: 'Components/Multichain/ConnectedSitePermissionsModal',
  component: ConnectedSitePermissionsModal,
  argTypes: {
    onClose: { control: 'function', action: 'onClose' },
    siteIcon: { control: 'text' },
    siteName: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<ConnectedSitePermissionsModalProps> = (args) => (
  <ConnectedSitePermissionsModal {...args} />
);

export const DefaultView = Template.bind({});

DefaultView.args = {
  onClose: () => {
    console.log('onClose');
  },
  siteName: 'app.uniswap.org',
  siteIcon: 'https://uniswap.org/favicon.ico',
};

export const Overflow: StoryFn<ConnectedSitePermissionsModalProps> = () => (
  <ConnectedSitePermissionsModal
    onClose={() => {
      console.log('onClose');
    }}
    siteName="reallyreallyreallyreallyreallyreallylongsitename.com"
    siteIcon="https://uniswap.org/favicon.ico"
  />
);
