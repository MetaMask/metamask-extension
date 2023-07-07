import React from 'react';
import { ConfirmationRow } from './confirmation-row';
import {
  ConfirmationInlineStatus,
  StatusType,
} from './confirmation-inline-status';

export default {
  title: 'Components/App/Modular Confirmations/Inline Status',

  component: ConfirmationInlineStatus,
  argTypes: {
    value: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => (
  <ConfirmationRow label="Something">
    <ConfirmationInlineStatus {...args} />
  </ConfirmationRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  type: StatusType.Error,
  value: '500 ETH',
};
