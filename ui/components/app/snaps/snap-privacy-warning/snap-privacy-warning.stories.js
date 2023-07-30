import React from 'react';

import SnapPrivacyWarning from '.';

export default {
  title: 'Components/App/snaps/SnapPrivacyWarning',
  component: SnapPrivacyWarning,
  argTypes: {
    onAccepted: {
      action: 'onAccepted',
    },
    onCanceled: {
      action: 'onCanceled',
    },
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    isOpen: true,
  },
};

export const DefaultStory = (args) => <SnapPrivacyWarning {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {};
