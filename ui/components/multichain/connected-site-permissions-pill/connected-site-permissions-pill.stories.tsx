import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { ConnectedSitePermissionsPill } from '.';

interface ConnectedSitePermissionsPillProps {
  actionButtonLabel?: string;
  siteName: string;
  siteIcon: string;
}

export default {
  title: 'Components/Multichain/ConnectedSitePermissionsPill',
  component: ConnectedSitePermissionsPill,
  argTypes: {
    actionButtonLabel: { control: 'text' },
    siteName: { control: 'text' },
    siteIcon: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<ConnectedSitePermissionsPillProps> = (args) => (
  <ConnectedSitePermissionsPill {...args} />
);

export const DefaultView = Template.bind({});
DefaultView.args = {
  actionButtonLabel: 'Permissions',
  siteName: 'app.uniswap.org',
  siteIcon: 'https://uniswap.org/favicon.ico',
};

export const NoActionButton: StoryFn<
  ConnectedSitePermissionsPillProps
> = () => (
  <ConnectedSitePermissionsPill
    siteName="app.uniswap.org"
    siteIcon="https://uniswap.org/favicon.ico"
  />
);

export const Overflow: StoryFn<ConnectedSitePermissionsPillProps> = () => (
  <ConnectedSitePermissionsPill
    actionButtonLabel="Permissions"
    siteName="reallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongsitename.com"
    siteIcon="https://uniswap.org/favicon.ico"
  />
);
