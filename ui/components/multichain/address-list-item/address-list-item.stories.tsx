import React from 'react';
import { Box } from '../../component-library';
import { AddressListItem } from '.';

const LABEL = 'metamask.eth';
const WRAPPER_PROPS = {
  style: {
    maxWidth: '328px',
    border: '1px solid var(--color-error-default)',
  },
};

const defaultStory = {
  title: 'Components/Multichain/AddressListItem',
  component: AddressListItem,
  argTypes: {
    label: {
      control: 'text',
    },
    address: {
      control: 'text',
    },
    onClick: {
      control: 'onClick',
    },
  },
  args: {
    address: '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb',
    label: LABEL,
    onClick: () => undefined,
  },
};

export default defaultStory;

export const DefaultStory = (args) => (
  <Box {...WRAPPER_PROPS}>
    <AddressListItem {...args} />
  </Box>
);
DefaultStory.storyName = 'Default';

export const ChaosStory = (args) => (
  <Box {...WRAPPER_PROPS}>
    <AddressListItem {...args} />
  </Box>
);
ChaosStory.storyName = 'Chaos';
ChaosStory.args = { label: LABEL.repeat(20) };

export const ConfusableStory = (args) => (
  <Box {...WRAPPER_PROPS}>
    <AddressListItem {...args} />
  </Box>
);
ConfusableStory.storyName = 'Confusable';
ConfusableStory.args = { label: '👻.eth' };
