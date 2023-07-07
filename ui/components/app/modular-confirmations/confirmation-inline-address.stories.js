import React from 'react';
import { ConfirmationRow } from './confirmation-row';
import { ConfirmationInlineAddress } from './confirmation-inline-address';

export default {
  title: 'Components/App/Modular Confirmations/Inline Address',

  component: ConfirmationInlineAddress,
  argTypes: {
    label: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => (
  <ConfirmationRow label="Account">
    <ConfirmationInlineAddress {...args} />
  </ConfirmationRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
};
