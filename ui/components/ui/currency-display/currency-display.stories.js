import React from 'react';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import CurrencyDisplay from '.';

export default {
  title: 'Components/UI/CurrencyDisplay',

  argTypes: {
    value: {
      control: {
        type: 'text',
      },
    },
    displayValue: {
      control: {
        type: 'text',
      },
    },
    currency: {
      control: {
        type: 'text',
      },
    },
    prefix: {
      control: {
        type: 'text',
      },
    },
    suffix: {
      control: {
        type: 'text',
      },
    },
    numberOfDecimals: {
      control: {
        type: 'text',
      },
    },
    denomination: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    denomination: 'ETH',
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
