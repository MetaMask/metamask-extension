import React from 'react';
import { ConfirmInfoRow } from './row';
import { ConfirmInfo, ConfirmInfoRowConfig, ConfirmInfoRowType } from './info';

const mockRowConfigs: ConfirmInfoRowConfig[] = [
  {
    label: 'Address',
    variant: ConfirmInfoRowType.Address,
    rowProps: {
      address: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
  },
  {
    variant: ConfirmInfoRowType.Divider,
  },
  {
    label: 'Account',
    variant: ConfirmInfoRowType.ValueDouble,
    rowProps: {
      left: '$834.32',
      right: '0.05 ETH',
    },
  },
];

const ConfirmInfoStory = {
  title: 'Components/App/Confirm/Info',
  component: ConfirmInfoRow,

  args: { rowConfigs: [...mockRowConfigs] },
  argTypes: {
    rowConfigs: {
      control: {
        type: 'object',
      },
    },
  },
};

export const DefaultStory = (args) => <ConfirmInfo {...args} />;

DefaultStory.storyName = 'Default';

export default ConfirmInfoStory;
