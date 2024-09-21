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
  },
};

export const DefaultStory = (args) => <SnapPrivacyWarning {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {};
