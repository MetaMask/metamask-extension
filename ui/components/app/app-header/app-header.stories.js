import React from 'react';
import AppHeader from '.';

export default {
  title: 'Components/App/AppHeader',
  id: __filename,
  argTypes: {
    history: {
      control: 'object',
    },
    networkDropdownOpen: {
      control: 'boolean',
    },
    showNetworkDropdown: {
      action: 'showNetworkDropdown',
    },
    hideNetworkDropdown: {
      action: 'hideNetworkDropdown',
    },
    toggleAccountMenu: {
      action: 'toggleAccountMenu',
    },
    selectedAddress: {
      control: 'text',
    },
    isUnlocked: {
      control: 'boolean',
    },
    hideNetworkIndicator: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    disableNetworkIndicator: {
      control: 'boolean',
    },
    isAccountMenuOpen: {
      control: 'boolean',
    },
    onClick: {
      action: 'onClick',
    },
  },
};

export const DefaultStory = (args) => <AppHeader {...args} />;

DefaultStory.storyName = 'Default';
