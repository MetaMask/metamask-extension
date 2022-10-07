import React from 'react';
import {
  COLORS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
import { ValidBackgroundColors, ValidBorderColors } from '../../ui/box';

import { AvatarToken } from '../avatar-token';
import README from './README.mdx';
import { AvatarBadge, badgePosition } from './avatar-badge';

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
  title: 'Components/ComponentLibrary/AvatarBadge',
  id: __filename,
  component: AvatarBadge,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    tokenList: { control: 'object' },
    address: { control: 'text' },
    diameter: { control: 'number' },
    badgePosition: { options: badgePosition, control: 'select' },
    backgroundColor: {
      options: ValidBackgroundColors,
      control: 'select',
    },
    borderColor: {
      options: ValidBorderColors,
      control: 'select',
    },
    display: {
      options: Object.values(DISPLAY),
      control: 'select',
      defaultValue: DISPLAY.FLEX,
      table: { category: 'box props' },
    },
    marginTop: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    tokenName: {
      control: 'text',
    },
    tokenImageUrl: {
      control: 'text',
    },
  },
  args: {
    size: SIZES.MD,
    backgroundColor: COLORS.BACKGROUND_ALTERNATIVE,
    borderColor: COLORS.BORDER_DEFAULT,
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    diameter: 32,
    tokenName: 'ast',
    tokenImageUrl: './AST.png',
    badgePosition: badgePosition.top,
  },
};

export const DefaultStory = (args) => (
  <AvatarBadge {...args} size={SIZES.MD}>
    <AvatarToken {...args} />
  </AvatarBadge>
);

DefaultStory.storyName = 'Default';
