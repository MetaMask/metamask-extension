import React from 'react';
import SnapAuthorship from '.';

export default {
  title: 'Components/App/Flask/SnapAuthorship',

  component: SnapAuthorship,
  argTypes: {
    snapId: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <SnapAuthorship {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  snapId: 'npm:@metamask/test-snap-bip44',
};
