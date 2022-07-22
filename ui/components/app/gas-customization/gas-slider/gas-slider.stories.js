import React from 'react';
import GasSlider from '.';

export default {
  title: 'Components/App/GasCustomization/GasSlider',
  id: __filename,
  argTypes: {
    onChange: {
      action: 'onChange',
    },
    lowLabel: {
      control: 'text',
    },
    highLabel: {
      control: 'text',
    },
    value: {
      control: 'number',
    },
    step: {
      control: 'number',
    },
    max: {
      control: 'number',
    },
    min: {
      control: 'number',
    },
  },
};

export const DefaultStory = () => <GasSlider />;

DefaultStory.storyName = 'Default';
