import React from 'react';
import Slider from '.';

export default {
  title: 'Slider',
  id: __filename,
};

export const slider = () => <Slider />;

export const sliderWithSteps = () => <Slider step={10} />;

export const sliderWithHeader = () => (
  <Slider
    titleText="Slider Title Text"
    tooltipText="Slider Tooltip Text"
    valueText="$ 00.00"
    titleDetail="100 GWEI"
  />
);

export const sliderWithFooter = () => (
  <Slider
    titleText="Slider Title Text"
    tooltipText="Slider Tooltip Text"
    valueText="$ 00.00"
    titleDetail="100 GWEI"
    infoText="Footer Info Text"
    onEdit={() => {
      console.log('on edit click');
    }}
  />
);
