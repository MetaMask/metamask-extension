import React from 'react';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../../../shared/constants/common';
import CurrencyDisplay from '.';

export default {
  title: 'Components/UI/CurrencyDisplay',
  argTypes: {
    className: {
      control: 'text',
    },
    currency: {
      control: 'text',
    },
    'data-testid': {
      control: 'text',
    },
    denomination: {
      control: 'select',
      options: [EtherDenomination.ETH, EtherDenomination.GWEI],
    },
    displayValue: {
      control: 'text',
    },
    hideLabel: {
      control: 'boolean',
    },
    hideTitle: {
      control: 'boolean',
    },
    numberOfDecimals: {
      control: 'number',
    },
    prefix: {
      control: 'text',
    },
    prefixComponent: {
      control: 'text',
    },
    style: {
      control: 'object',
    },
    suffix: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
    prefixComponentWrapperProps: {
      control: 'object',
    },
    textProps: {
      control: 'object',
    },
    suffixProps: {
      control: 'object',
    },
    boxProps: {
      control: 'object',
    },
  },
  args: {
    denomination: EtherDenomination.ETH,
    value: decimalToHex('123.45'),
    numberOfDecimals: '2',
    currency: 'USD',
    prefix: '$',
  },
};

export const DefaultStory = (args) => <CurrencyDisplay {...args} />;
DefaultStory.storyName = 'Default';

export const DisplayValueStory = (args) => (
  <CurrencyDisplay {...args} displayValue="44.43" />
);
DefaultStory.storyName = 'Display Value';
