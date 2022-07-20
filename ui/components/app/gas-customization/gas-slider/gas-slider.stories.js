import React from 'react';
import GasSlider from '.';

export default {
  title: 'Components/UI/GasSlider', // title should follow the folder structure location of the component. Don't use spaces.
  id: __filename,
  argTypes: {
    onChange: {
      control: 'func',
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
