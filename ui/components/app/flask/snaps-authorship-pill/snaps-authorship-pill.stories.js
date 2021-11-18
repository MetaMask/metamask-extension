import React from 'react';
import SnapsAuthorshipPill from '.';

export default {
  title: 'App/Flask/SnapsAuthorshipPill',
  id: __filename,
  component: SnapsAuthorshipPill,
  argTypes: {
    packageName: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <SnapsAuthorshipPill {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  packageName: 'npm-package-name',
};
