import React from 'react';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowAddress } from './address';

const ConfirmInfoRowAddressStory = {
  title: 'Components/App/Confirm/InfoRowAddress',

  component: ConfirmInfoRowAddress,
  argTypes: {
    label: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => (
  <ConfirmInfoRow label="Account">
    <ConfirmInfoRowAddress {...args} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
};

export default ConfirmInfoRowAddressStory;
