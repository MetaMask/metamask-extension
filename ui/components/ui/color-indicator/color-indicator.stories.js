import React from 'react';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';
import ColorIndicator from './color-indicator';

export default {
  title: 'Components/UI/ColorIndicator',
  id: __filename,
  argTypes: {
    size: {
      control: {
        type: 'select',
      },
      options: SIZES,
      defaultValue: SIZES.LG,
    },
    type: {
      control: {
        type: 'select',
      },
      options: ColorIndicator.TYPES,
      defaultValue: ColorIndicator.TYPES.FILLED,
    },
    color: {
      control: {
        type: 'select',
      },
      options: COLORS,
      defaultValue: COLORS.PRIMARY_DEFAULT,
    },
    borderColor: {
      control: {
        type: 'select',
      },
      options: { NONE: undefined, ...COLORS },
      defaultValue: undefined,
    },
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
