import React from 'react';

import HomeNotification from './home-notification.component';

export default {
  title: 'Components/App/HomeNotification',

  component: HomeNotification,
  argTypes: {
    acceptText: {
      control: 'text',
    },
    checkboxText: {
      control: 'text',
    },
    checkboxTooltipText: {
      control: 'text',
    },
    classNames: {
      control: 'object',
    },
    descriptionText: {
      control: 'text',
    },
    ignoreText: {
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

const Template = (args) => <HomeNotification {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  acceptText: 'Accept text',
  descriptionText: 'Description text',
  ignoreText: 'Ignore text',
  infoText: 'Info text',
};

export const WithIgnoreCheckbox = Template.bind({});
WithIgnoreCheckbox.storyName = 'WithIgnoreCheckbox';
WithIgnoreCheckbox.args = {
  ...DefaultStory.args,
  checkboxText: "Don't show this again",
  checkboxTooltipText:
    'The value of this checkbox is passed to the `onIgnore` function when the ignore button is pressed',
  descriptionText: 'Description text',
};

export const OnlyDescription = Template.bind({});
OnlyDescription.storyName = 'OnlyDescription';
OnlyDescription.args = {
  descriptionText: 'Non-Interactive notification.',
};

export const DescriptionAndInfo = Template.bind({});
DescriptionAndInfo.storyName = 'DescriptionAndInfo';
DescriptionAndInfo.args = {
  descriptionText: 'Non-Interactive notification.',
  infoText: 'Info text',
};

export const OnlyAccept = Template.bind({});
OnlyAccept.storyName = 'OnlyAccept';
OnlyAccept.args = {
  acceptText: 'Mandatory Action',
  descriptionText:
    "The 'Accept' action for this notification is strongly recommended, so there is no option to dismiss",
};

export const OnlyIgnore = Template.bind({});
OnlyIgnore.storyName = 'OnlyIgnore';
OnlyIgnore.args = {
  descriptionText: 'This is a dismissable notification.',
  ignoreText: 'Dismiss',
};
