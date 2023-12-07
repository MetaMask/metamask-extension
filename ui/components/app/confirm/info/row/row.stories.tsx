import React from 'react';
import { ConfirmInfoRow, ConfirmInfoRowState } from './row';

const ConfirmInfoRowStory = {
  title: 'Components/App/Confirm/InfoRow',

  component: ConfirmInfoRow,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowState),
    },
    label: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <ConfirmInfoRow {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  label: 'Key',
  children: 'Value',
};

export default ConfirmInfoRowStory;
