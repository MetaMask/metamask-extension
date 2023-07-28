import React from 'react';
import ConfirmRemoveAccount from '.';

export default {
  title: 'Components/App/Modals/ConfirmRemoveAccount',

  component: ConfirmRemoveAccount,
  argTypes: {
    account: {
      control: 'object',
    },
  },
  args: {
    account: {
      control: 'object',
    },
  },
};

const Template = (args) => {
  return <ConfirmRemoveAccount {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
