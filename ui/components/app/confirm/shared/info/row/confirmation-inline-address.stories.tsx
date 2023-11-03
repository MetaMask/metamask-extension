import React from 'react';
import { ConfirmationRow } from './confirmation-row';
import { ConfirmationInlineAddress } from './confirmation-inline-address';

const ConfirmationInlineAddressStory = {
  title: 'Components/App/Confirmations/Inline Address',

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

export default ConfirmationInlineAddressStory;
