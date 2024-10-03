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

type TransactionFailedModalArgs = {
  hideModal: () => void;
  closeNotification?: boolean;
  operationFailed?: boolean;
  errorMessage?: string;
};

export const DefaultStory = (args: TransactionFailedModalArgs) => {
  return <TransactionFailedModal {...args} />;
};

DefaultStory.storyName = 'TransactionFailedModal';
