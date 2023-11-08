import React from 'react';
import { ConfirmInfoRow } from './row';

const ConfirmInfoRowStory = {
  title: 'Components/App/Confirm/InfoRow',

  component: ConfirmInfoRow,
  argTypes: {
    label: {
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
