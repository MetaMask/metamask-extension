import React from 'react';
import { select } from '@storybook/addon-knobs';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';
import ColorIndicator from './color-indicator';

export default {
  title: 'ColorIndicator',
};

export const colorIndicator = () => (
  <ColorIndicator
    size={select('size', SIZES, SIZES.LG)}
    type={select('type', ColorIndicator.TYPES, ColorIndicator.TYPES.FILLED)}
    color={select('color', COLORS, COLORS.PRIMARY1)}
    borderColor={select('borderColor', { NONE: undefined, ...COLORS })}
  />
);

export const withIcon = () => (
  <ColorIndicator
    size={select('size', SIZES, SIZES.LG)}
    type={select('type', ColorIndicator.TYPES, ColorIndicator.TYPES.FILLED)}
    color={select('color', COLORS, COLORS.PRIMARY1)}
    iconClassName="fa fa-question"
    borderColor={select('borderColor', { NONE: undefined, ...COLORS })}
  />
);
