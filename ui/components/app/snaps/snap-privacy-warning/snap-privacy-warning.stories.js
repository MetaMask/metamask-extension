import React from 'react';

import SnapPrivacyWarning from '.';

export default {
  title: 'Components/App/snaps/SnapPrivacyWarning',

  component: SnapPrivacyWarning,
  argTypes: {
    onOk: {
      action: 'onOk',
    },
  },
};

export const DefaultStory = (args) => <SnapPrivacyWarning {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {};
