import React from 'react';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';
import ColorIndicator from './color-indicator';

export default {
  title: 'Components/UI/ColorIndicator',

  argTypes: {
    size: {
      control: {
        type: 'select',
      },
      options: SIZES,
    },
    type: {
      control: {
        type: 'select',
      },
      options: ColorIndicator.TYPES,
    },
    color: {
      control: {
        type: 'select',
      },
      options: COLORS,
    },
    borderColor: {
      control: {
        type: 'select',
      },
      options: { NONE: undefined, ...COLORS },
    },
  },
  args: {
    size: SIZES.LG,
    type: ColorIndicator.TYPES.FILLED,
    color: COLORS.PRIMARY_DEFAULT,
  },
};

export const DefaultStory = (args) => (
  <ColorIndicator
    size={args.size}
    type={args.type}
    color={args.color}
    borderColor={args.borderColor}
  />
);

DefaultStory.storyName = 'Default';

export const WithIcon = (args) => (
  <ColorIndicator
    size={args.size}
    type={args.type}
    color={args.color}
    iconClassName="fa fa-question"
    borderColor={args.borderColor}
  />
);
