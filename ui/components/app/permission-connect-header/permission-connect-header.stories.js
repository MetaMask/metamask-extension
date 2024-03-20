import React from 'react';
import PermissionConnectHeader from '.';

export default {
  title: 'Components/App/PermissionConnectHeader',
  component: PermissionConnectHeader,
};

export const DefaultStory = (args) => <PermissionConnectHeader {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  title: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
};

export const HeaderWithFallbackIcon = (args) => (
  <PermissionConnectHeader {...args} />
);

HeaderWithFallbackIcon.args = {
  title: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  iconUrl: '',
};

export const HeaderWithFallbackTitle = (args) => (
  <PermissionConnectHeader {...args} />
);

HeaderWithFallbackTitle.args = {
  title: 'https://metamask.github.io',
  origin: 'https://metamask.github.io',
  iconUrl: '',
};
