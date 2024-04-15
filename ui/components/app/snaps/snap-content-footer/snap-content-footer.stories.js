import React from 'react';

import SnapContentFooter from '.';

export default {
  title: 'Components/App/Snaps/SnapContentFooter',

  component: SnapContentFooter,
  args: {
    snapName: 'Really Long Test Snap Name',
    snapId: 'local:test-snap',
  },
};

export const DefaultStory = (args) => <SnapContentFooter {...args} />;

DefaultStory.storyName = 'Default';
