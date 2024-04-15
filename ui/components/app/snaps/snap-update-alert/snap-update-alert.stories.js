import React from 'react';

import SnapUpdateAlert from '.';

export default {
  title: 'Components/App/snaps/SnapUpdateAlert',
  component: SnapUpdateAlert,
  argTypes: {
    onUpdateClick: {
      action: 'onUpdateClick',
    },
  },
};

export const DefaultStory = (args) => <SnapUpdateAlert {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {};
