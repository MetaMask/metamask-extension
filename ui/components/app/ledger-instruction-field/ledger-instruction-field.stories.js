import React from 'react';
import LedgerInstructionField from '.';

export default {
  title: 'Components/App/LedgerInstructionField',
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
