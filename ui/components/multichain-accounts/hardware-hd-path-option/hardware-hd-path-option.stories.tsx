import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { HardwareHdPathOption } from './hardware-hd-path-option';

export default {
  title: 'Components/MultichainAccounts/HardwareHdPathOption',
  component: HardwareHdPathOption,
  args: {
    label: 'Ledger Live',
    isSelected: true,
  },
} as Meta<typeof HardwareHdPathOption>;

export const DefaultStory: StoryFn<typeof HardwareHdPathOption> = (args) => (
  <HardwareHdPathOption {...args} />
);

DefaultStory.storyName = 'Default';

export const Unselected: StoryFn<typeof HardwareHdPathOption> = (args) => (
  <HardwareHdPathOption {...args} isSelected={false} />
);
