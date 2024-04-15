import React from 'react';
import { IconName } from '../../../component-library';
import InstallError from './install-error';

export default {
  title: 'Components/App/Snaps/InstallError',
  component: InstallError,
  argTypes: {
    title: {
      control: 'text',
    },
    error: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    iconName: {
      control: 'text',
    },
  },
  args: {
    title: 'Connection failed',
    error:
      'Failed to fetch Snap "npm:metamask/test-snap-error: Failed to fetch',
    description:
      'Fetching of Error Test Snap failed, check you network and try again.',
    iconName: IconName.Warning,
  },
};

export const DefaultStory = (args) => <InstallError {...args} />;
DefaultStory.storyName = 'Default';
