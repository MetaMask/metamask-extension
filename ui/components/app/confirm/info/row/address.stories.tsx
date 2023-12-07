import React from 'react';
import { ConfirmInfoRow, ConfirmInfoRowState } from './row';
import { ConfirmInfoRowAddress } from './address';

const ConfirmInfoRowAddressStory = {
  title: 'Components/App/Confirm/InfoRowAddress',

  component: ConfirmInfoRowAddress,
  argTypes: {
    state: {
      control: 'select',
      options: Object.values(ConfirmInfoRowState),
    },
    label: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ state, address }) => (
  <ConfirmInfoRow label="Account" state={state}>
    <ConfirmInfoRowAddress address={address} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
};

export default ConfirmInfoRowAddressStory;
