import React from 'react';
import { ConfirmationRow } from './confirmation-row';

export default {
  title: 'Components/App/Modular Confirmations/Row',

  component: ConfirmationRow,
  argTypes: {
    label: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <ConfirmationRow {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  label: 'Key',
  value: 'Value',
};
