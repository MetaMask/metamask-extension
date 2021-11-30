import React from 'react';

import HomeNotification from './home-notification.component';

export default {
  title: 'Components/App/HomeNotification',
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
    onAccept: {
      action: 'onAccept',
    },
    onIgnore: {
      action: 'onIgnore',
    },
  },
};

export const DefaultStory = (args) => <HomeNotification {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  acceptText: 'Accept text',
  checkboxText: 'Checkbox text',
  checkboxTooltipText: 'Checkbox tooltip text',
  ignoreText: 'Ignore text',
  infoText: 'Info text',
  descriptionText: 'Description text',
};
