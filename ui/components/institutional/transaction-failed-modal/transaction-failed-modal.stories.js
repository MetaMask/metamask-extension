import React from 'react';
import TransactionFailedModal from '.';

export default {
  title: 'Components/Institutional/TransactionFailedModal',
  argTypes: {},
  args: {
    errorMessage: 'test',
    operationFailed: false,
  },
};

export const DefaultStory = (args) => {
  return <TransactionFailedModal {...args} />;
};

DefaultStory.storyName = 'TransactionFailedModal';
