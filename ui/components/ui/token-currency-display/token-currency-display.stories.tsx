import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TokenCurrencyDisplay from './token-currency-display.component';

const meta: Meta<typeof TokenCurrencyDisplay> = {
  title: 'Components/UI/TokenCurrencyDisplay',
  component: TokenCurrencyDisplay,
  argTypes: {
    className: { control: 'text' },
    transactionData: { control: 'text' },
    token: { control: 'object' },
    prefix: { control: 'text' },
  },
  args: {
    className: '',
    transactionData: '0x123',
    token: { symbol: 'ETH' },
    prefix: '',
  },
};

export default meta;
type Story = StoryObj<typeof TokenCurrencyDisplay>;

export const Default: Story = {};
