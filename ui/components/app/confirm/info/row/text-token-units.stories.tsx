import React from 'react';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowTextTokenUnits } from './text-token-units';

export default {
  title: 'Components/App/Confirm/InfoRowTextToken',
  component: ConfirmInfoRowTextTokenUnits,
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
  <ConfirmInfoRowTextTokenUnits {...args} />;

