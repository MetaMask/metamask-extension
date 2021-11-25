import React from 'react';

import HomeNotification from './home-notification.component';

export default {
  title: 'UI/HomeNotification',
  id: __filename,
  component: HomeNotification,
  parameters: {},
  argTypes: {
    checkboxText: {
      control: 'text',
    },
    acceptText: {
      control: 'text',
    },
    ignoreText: {
      control: 'text',
    },
    descriptionText: {
      control: 'text',
    },
    infoText: {
      control: 'text',
    },
  },
};

const noop = () => {
  // noop
};

export const DefaultStory = (args) => (
  <HomeNotification {...args} onAccept={noop} onIgnore={noop} />
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  ignoreText: 'foo',
};
