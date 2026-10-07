import React from 'react';
import CurrencyInput from './currency-input';

export default {
  title: 'Components/App/CurrencyInput',

  argTypes: {
    hexValue: {
      control: 'text',
    },
    isFiatPreferred: {
      control: 'boolean',
    },
    onChange: {
      action: 'onChange',
    },
    onPreferenceToggle: {
      action: 'onPreferenceToggle',
    },
  },
};

export const DefaultStory = (args) => <CurrencyInput {...args} />;

DefaultStory.storyName = 'Default';
