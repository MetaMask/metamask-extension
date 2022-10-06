import React from 'react';

import SnapContentFooter from '.';

export default {
  title: 'Components/App/Flask/SnapContentFooter',
  id: __filename,
  component: SnapContentFooter,
  args: {
    snapName: 'Test Snap',
    snapId: 'local:test-snap',
  },
};

export const DefaultStory = (args) => <SnapContentFooter {...args} />;

DefaultStory.storyName = 'Default';
