import React from 'react';
import { ConfirmInfoRow, ConfirmInfoRowState } from './row';
import { ConfirmInfoRowValueDouble } from './value-double';

const ConfirmInfoRowValueDoubleStory = {
  title: 'Components/App/Confirm/InfoRowValueDouble',

  component: ConfirmInfoRowValueDouble,
  argTypes: {
    state: {
      control: 'select',
      options: Object.values(ConfirmInfoRowState),
    },
    left: {
      control: 'text',
    },
    right: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ state, left, right }) => (
  <ConfirmInfoRow label="Account" state={state}>
    <ConfirmInfoRowValueDouble left={left} right={right} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  left: '$834.32',
  right: '0.05 ETH',
};

export default ConfirmInfoRowValueDoubleStory;
