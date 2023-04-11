import React from 'react';
import EditableLabel from '.';

export default {
  title: 'Components/UI/EditableLabel',

  argTypes: {
    onSubmit: {
      action: 'onSubmit',
    },
    defaultValue: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    accounts: {
      control: 'array',
    },
  },
  args: {
    defaultValue: 'Account 3',
    accounts: [
      {
        name: 'Account 1',
      },
      {
        name: 'Account 2',
      },
    ],
  },
};

export const DefaultStory = (args) => (
  <div style={{ position: 'relative', width: 335 }}>
    <EditableLabel {...args} />
  </div>
);

DefaultStory.storyName = 'Default';
