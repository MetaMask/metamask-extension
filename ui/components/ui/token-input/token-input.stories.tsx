import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TokenInput from './token-input.component';

const meta: Meta<typeof TokenInput> = {
  title: 'Components/UI/TokenInput',
  component: TokenInput,
  argTypes: {
    dataTestId: { control: 'text' },
    currentCurrency: { control: 'text' },
    onChange: { action: 'changed' },
    value: { control: 'text' },
    showFiat: { control: 'boolean' },
    hideConversion: { control: 'boolean' },
    token: {
      control: 'object',
      defaultValue: {
        address: '0x0',
        decimals: 18,
        symbol: 'ETH',
      },
    },
    tokenExchangeRates: { control: 'object' },
    nativeCurrency: { control: 'text' },
    tokens: { control: 'array' },
  },
  args: {
    dataTestId: 'token-input',
    currentCurrency: 'USD',
    value: '0x0',
    showFiat: true,
    hideConversion: false,
    token: {
      address: '0x0',
      decimals: 18,
      symbol: 'ETH',
    },
    tokenExchangeRates: {},
    nativeCurrency: 'ETH',
    tokens: [
      {
        address: '0x0',
        decimals: 18,
        symbol: 'ETH',
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof TokenInput>;

export const Default: Story = {};
