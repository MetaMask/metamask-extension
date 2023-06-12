import React from 'react';

import SnapContentFooter from '.';

export default {
  title: 'Components/App/Snaps/SnapContentFooter',

  component: SnapContentFooter,
  args: {
    snapName: 'Test Snap',
    snapId: 'local:test-snap',
  },
};

export const DefaultStory = (args) => <SnapContentFooter {...args} />;

DefaultStory.storyName = 'Default';
