import React from 'react';
import { ConfirmInfoRow, ConfirmInfoRowVariant } from './row';
import { ConfirmInfoRowValueDouble } from './value-double';

const ConfirmInfoRowValueDoubleStory = {
  title: 'Components/App/Confirm/InfoRowValueDouble',

  component: ConfirmInfoRowValueDouble,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowVariant),
    },
    left: {
      control: 'text',
    },
    right: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ variant, left, right }) => (
  <ConfirmInfoRow label="Account" variant={variant}>
    <ConfirmInfoRowValueDouble left={left} right={right} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  left: '$834.32',
  right: '0.05 ETH',
};

export default ConfirmInfoRowValueDoubleStory;
