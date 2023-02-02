import React from 'react';
import { Color, Size } from '../../../helpers/constants/design-system';
import ColorIndicator from './color-indicator';

export default {
  title: 'Components/UI/ColorIndicator',

  argTypes: {
    size: {
      control: {
        type: 'select',
      },
      options: Size,
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
      options: Color,
    },
    borderColor: {
      control: {
        type: 'select',
      },
      options: { NONE: undefined, ...Color },
    },
  },
  args: {
    size: Size.LG,
    type: ColorIndicator.TYPES.FILLED,
    color: Color.primaryDefault,
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
