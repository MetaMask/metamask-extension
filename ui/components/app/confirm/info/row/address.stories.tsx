import React from 'react';
import { ConfirmInfoRow, ConfirmInfoRowVariant } from './row';
import { ConfirmInfoRowAddress } from './address';
import { TEST_ADDRESS } from './constants';

const ConfirmInfoRowAddressStory = {
  title: 'Components/App/Confirm/InfoRowAddress',

  component: ConfirmInfoRowAddress,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowVariant),
    },
    label: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ variant, address }) => (
  <ConfirmInfoRow label="Account" variant={variant}>
    <ConfirmInfoRowAddress address={address} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  address: TEST_ADDRESS,
};

export default ConfirmInfoRowAddressStory;
