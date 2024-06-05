import React from 'react';
import LedgerInstructionField from '.';

export default {
  title: 'Confirmations/Components/LedgerInstructionField',
  argTypes: {
    showDataInstruction: {
      control: {
        type: 'boolean',
      },
    },
  },
};

export const DefaultStory = (args) => <LedgerInstructionField {...args} />;

DefaultStory.storyName = 'Default';
