import React from 'react';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  BORDER_STYLE,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import Box from './box';

const sizeKnobOptions = [undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const marginSizeKnobOptions = [...sizeKnobOptions, 'auto'];

export default {
  title: 'Components/UI/Box',
  id: __filename,
  component: Box,
  argTypes: {
    size: {
      control: { type: 'range', min: 50, max: 500, step: 10 },
      table: { category: 'children' },
      defaultValue: 100,
    },
    items: {
      control: 'number',
      table: { category: 'children' },
      defaultValue: 1,
    },
    display: {
      options: DISPLAY,
      control: 'select',
      defaultValue: DISPLAY.BLOCK,
      table: { category: 'display' },
    },
    width: {
      options: BLOCK_SIZES,
      control: 'select',
      defaultValue: BLOCK_SIZES.HALF,
      table: { category: 'display' },
    },
    height: {
      options: BLOCK_SIZES,
      control: 'select',
      defaultValue: BLOCK_SIZES.HALF,
      table: { category: 'display' },
    },
    justifyContent: {
      options: JUSTIFY_CONTENT,
      control: 'select',
      defaultValue: JUSTIFY_CONTENT.FLEX_START,
      table: { category: 'display' },
    },
    alignItems: {
      options: ALIGN_ITEMS,
      control: 'select',
      defaultValue: ALIGN_ITEMS.FLEX_START,
      table: { category: 'display' },
    },
    textAlign: {
      options: TEXT_ALIGN,
      control: 'select',
      defaultValue: TEXT_ALIGN.LEFT,
      table: { category: 'left' },
    },
    margin: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginTop: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginRight: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginBottom: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    marginLeft: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'margin' },
    },
    padding: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingTop: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingRight: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingBottom: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    paddingLeft: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'padding' },
    },
    borderStyle: {
      options: BORDER_STYLE,
      control: 'select',
      defaultValue: BORDER_STYLE.DASHED,
      table: { category: 'border' },
    },
    borderWidth: {
      options: sizeKnobOptions,
      control: 'number',
      defaultValue: 1,
      table: { category: 'border' },
    },
    borderColor: {
      options: COLORS,
      control: 'select',
      defaultValue: COLORS.BLACK,
      table: { category: 'border' },
    },
    backgroundColor: {
      options: COLORS,
      defaultValue: COLORS.WHITE,
      control: 'select',
      table: { category: 'background' },
    },
  },
};

export const DefaultStory = (args) => {
  const { items, size, ...rest } = args;
  const children = [];
  for (let $i = 0; $i < items; $i++) {
    children.push(
      <img width={size} height={size} src="./images/eth_logo.svg" />,
    );
  }
  return <Box {...rest}>{children}</Box>;
};

DefaultStory.storyName = 'Default';
