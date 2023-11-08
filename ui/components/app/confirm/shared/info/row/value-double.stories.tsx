import React from 'react';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowValueDouble } from './value-double';

const ConfirmInfoRowValueDoubleStory = {
  title: 'Components/App/Confirm/InfoRowValueDouble',

  component: ConfirmInfoRowValueDouble,
  argTypes: {
    left: {
      control: 'text',
    },
    right: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => (
  <ConfirmInfoRow label="Account">
    <ConfirmInfoRowValueDouble {...args} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  left: '$834.32',
  right: '0.05 ETH',
};

export default ConfirmInfoRowValueDoubleStory;
