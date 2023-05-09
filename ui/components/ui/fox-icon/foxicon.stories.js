import React from 'react';
import FoxIcon, { COLOR_PALETTE_TYPE } from './FoxIcon';

const ADDRESS_LIBRARY = [
  '0xFa14fc33c8E73ebC526502f0A783c0cDe2740f96',
  '0x52b538FF61873eCBF5E61AE1A89407BA55EBF9a1',
  '0x7D4CFAA4f8A8D6f660A9bdCA4bCF25ca801c0DC1',
  '0x1deC584A26BcAd4D28E2508bBC87B3611bf01c87',
  '0x29BaEDD0Cfe11B0d84c05CfD37eC88263A9ef2C3',
  '0x41d3de1F1F797A8aC5e6731869DA3e4886cF273f',
  '0xf97dAFE5D831dFaF05C57f7d336935D763BA2E63',
];

export default {
  title: 'Components/UI/FoxIcon',
  component: FoxIcon,

  argTypes: {
    colorPaletteType: {
      control: 'select',
      name: 'Preferred result generator',
      options: Object.values(COLOR_PALETTE_TYPE),
    },
    predefinedColorSchema: {
      control: 'select',
      name: 'Choose pre-definied when you are not happy with current result',
      options: [1, 2, 3, 4, 5],
    },
    address: {
      control: 'select',
      name: 'Sample address',
      options: ADDRESS_LIBRARY,
    },
    size: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <FoxIcon {...args} />;

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  colorPaletteType: COLOR_PALETTE_TYPE.generative,
  address: '0xFa14fc33c8E73ebC526502f0A783c0cDe2740f96',
  size: '240',
  predefinedColorSchema: 0,
};
