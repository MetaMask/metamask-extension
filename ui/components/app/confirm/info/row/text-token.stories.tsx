import React from 'react';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowTextToken } from './text-token';

export default {
  title: 'Components/App/Confirm/InfoRowTextToken',
  component: ConfirmInfoRowTextToken,
  decorators: [
    (story) => <ConfirmInfoRow label="Amount">{story()}</ConfirmInfoRow>,
  ],
  argTypes: {
    value: {
      control: 'text',
    },
    decimals: {
      control: 'number',
    },
  },
  args: {
    value: '3000198768',
    decimals: 5,
  },
};

export const DefaultStory = (args: { value: string, decimals: number }) =>
  <ConfirmInfoRowTextToken {...args} />;

