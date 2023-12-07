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
  // todo: replace row variant for Message. Possible value or value-expandable. neither have been created yet
  {
    label: 'Message',
    variant: ConfirmInfoRowType.ValueDouble,
    rowProps: {
      left: '',
      right:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel suscipit tortor. Curabitur vulputate felis nibh, vel pellentesque erat fermentum eget. Duis id turpis cursus, blandit magna sit amet, tempor sem. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Maecenas ex nulla, suscipit id eros in, elementum lacinia leo. Etiam dignissim neque vitae nibh pretium, sed egestas est mollis. Nam venenatis tellus sed tempor bibendum.',
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

export const DefaultStory = (args) => (
  <Box
    background>
    <ConfirmInfo {...args} />
  </Box>
);

DefaultStory.storyName = 'Default';

export default ConfirmInfoStory;
