import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { ConfirmInfoRowAddressDisplay } from './address-display';
import { TEST_ADDRESS } from './constants';

const meta: Meta<typeof ConfirmInfoRowAddressDisplay> = {
  title: 'Components/App/Confirm/ConfirmInfoRowAddressDisplay',
  component: ConfirmInfoRowAddressDisplay,
  argTypes: {
    displayState: {
      control: 'select',
      options: Object.values(TrustSignalDisplayState),
    },
  },
  args: {
    address: TEST_ADDRESS,
    chainId: '0x1',
    name: 'Uniswap V3',
    isAccount: false,
    displayState: TrustSignalDisplayState.Verified,
    showAvatar: true,
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmInfoRowAddressDisplay>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';
