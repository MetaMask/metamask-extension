import React from 'react';
import { Meta } from '@storybook/react';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../../../test/e2e/constants';
import SnapAccountRedirect from './snap-account-redirect';

export default {
  title: 'Components/UI/SnapAccountRedirect',
  argTypes: {
    snapName: {
      control: {
        type: 'text',
      },
    },
    isBlockedUrl: {
      control: {
        type: 'boolean',
      },
    },
    url: {
      control: {
        type: 'text',
      },
    },
    message: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    snapName: 'Snap Simple Keyring',
    isBlockedUrl: false,
    url: TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL,
    message: 'Redirecting to Snap Simple Keyring',
  },
} as Meta<typeof SnapAccountRedirect>;

export const DefaultStory = (args) => <SnapAccountRedirect {...args} />;
DefaultStory.storyName = 'Default';
