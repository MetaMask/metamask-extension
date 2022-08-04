import React from 'react';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
import { ValidBackgroundColors, ValidBorderColors } from '../../ui/box';

import { AvatarToken } from './avatar-token';

const marginSizeKnobOptions = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/AvatarToken',
  id: __filename,
  component: AvatarToken,
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    tokenName: {
      control: 'text',
    },
    tokenImageUrl: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <AvatarToken {...args} />;

DefaultStory.storyName = 'Default';


DefaultStory.args = {
  tokenName: 'ast',
  tokenImageUrl: './AST.png',
  size: SIZES.XS,
};
