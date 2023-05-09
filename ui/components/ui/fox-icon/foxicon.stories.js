import React from 'react';
import FoxIcon from './FoxIcon';
import {
  fillInFoxColor,
  FOX_COLOR_PALETTE,
} from '../../../helpers/utils/generative-color';

export default {
  title: 'Components/UI/FoxIcon',
  component: FoxIcon,

  argTypes: {
    address: { control: 'text' },
  },
};

const colorSchema = FOX_COLOR_PALETTE;

export const DefaultStory = (args) => <FoxIcon {...args} />;

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  size: 32,
};
