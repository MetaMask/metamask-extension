import React from 'react';
import ConfirmRemoveAccount from '.';

export default {
  title: 'Components/App/Modals/ConfirmRemoveAccount',
  id: __filename,
  component: ConfirmRemoveAccount,
  argTypes: {
    identity: {
      control: 'object',
    },
  },
  args: {
    identity: {
      control: 'object',
    },
  },
};

const Template = (args) => {
  return <ConfirmRemoveAccount {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
