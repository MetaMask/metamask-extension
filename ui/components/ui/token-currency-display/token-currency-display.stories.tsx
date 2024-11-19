import React from 'react';
import { Meta, Story } from '@storybook/react';
import TokenCurrencyDisplay from './token-currency-display.component';
import { TokenCurrencyDisplayProps } from './token-currency-display.types';

export default {
  title: 'Components/UI/TokenCurrencyDisplay',
  component: TokenCurrencyDisplay,
  argTypes: {
    className: { control: 'text' },
    transactionData: { control: 'text' },
    token: { control: 'object' },
    prefix: { control: 'text' },
  },
} as Meta;

const Template: Story<TokenCurrencyDisplayProps> = (args) => <TokenCurrencyDisplay {...args} />;

export const Default = Template.bind({});
Default.args = {
  className: '',
  transactionData: '0x123',
  token: { symbol: 'ETH' },
  prefix: '',
};
