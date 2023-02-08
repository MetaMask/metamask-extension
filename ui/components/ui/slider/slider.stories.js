import React from 'react';
import README from './README.mdx';
import Slider from '.';

export default {
  title: 'Components/UI/Slider',

  component: Slider,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    editText: { control: 'text' },
    infoText: { control: 'text' },
    titleDetail: { control: 'text' },
    titleText: { control: 'text' },
    tooltipText: { control: 'text' },
    valueText: { control: 'text' },
    max: { control: 'number' },
    min: { control: 'number' },
    onChange: { action: 'onChange' },
    onEdit: { action: 'onEdit' },
    step: { control: 'number' },
    value: { control: 'number' },
  },
};

export const DefaultStory = (args) => <Slider {...args} />;
DefaultStory.storyName = 'Default';

export const WithSteps = (args) => <Slider {...args} />;
WithSteps.args = {
  step: 10,
};

export const WithHeader = (args) => <Slider {...args} />;
WithHeader.args = {
  titleText: 'Slider Title Text',
  tooltipText: 'Slider Tooltip Text',
  valueText: '$ 00.00',
  titleDetail: '100 GWEI',
};

export const WithFooter = (args) => <Slider {...args} />;
WithFooter.args = {
  titleText: 'Slider Title Text',
  tooltipText: 'Slider Tooltip Text',
  valueText: '$ 00.00',
  titleDetail: '100 GWEI',
  infoText: 'Footer Info Text',
};
