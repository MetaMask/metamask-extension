import React from 'react';
import { ConnectedSitePermissionsPill } from './connected-site-permissions-pill';

export default {
  title: 'Components/Multichain/ConnectedSitePermissionsPill',
};

const Template = (args) => <ConnectedSitePermissionsPill {...args} />;

export const DefaultView = Template.bind({});
DefaultView.args = {
  actionButtonLabel: 'Permissions',
  siteName: 'app.uniswap.org',
  siteIcon: 'https://uniswap.org/favicon.ico',
};

DefaultView.argTypes = {
  actionButtonLabel: { control: 'text' },
  siteName: { control: 'text' },
  siteIcon: { control: 'text' },
};

export const NoActionButton = () => (
  <ConnectedSitePermissionsPill
    siteName="app.uniswap.org"
    siteIcon="https://uniswap.org/favicon.ico"
  />
);

export const Overflow = () => (
  <ConnectedSitePermissionsPill
    actionButtonLabel="Permissions"
    siteName="reallylongsitenamethatwilloverflowforeverandevertilltheendoftime.com"
    siteIcon="https://uniswap.org/favicon.ico"
  />
);
