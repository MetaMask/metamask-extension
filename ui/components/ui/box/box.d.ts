import * as React from 'react';

import {
  AlignItems,
  BLOCK_SIZES,
  BorderStyle,
  BackgroundColor,
  BorderColor,
  TextColor,
  IconColor,
  DISPLAY,
  JustifyContent,
  TEXT_ALIGN,
  FLEX_DIRECTION,
  FLEX_WRAP,
  BorderRadius,
} from '../../../helpers/constants/design-system';

export type BoxChildren = React.ReactNode | ((...args: any[]) => any);

export type BoxFlexDirection = typeof FLEX_DIRECTION;
export type BoxFlexDirectionArray = [
  BoxFlexDirection[keyof BoxFlexDirection],
  BoxFlexDirection[keyof BoxFlexDirection]?,
  BoxFlexDirection[keyof BoxFlexDirection]?,
  BoxFlexDirection[keyof BoxFlexDirection]?,
];

export type BoxFlexWrap = typeof FLEX_WRAP;
export type BoxFlexWrapArray = [
  BoxFlexWrap[keyof BoxFlexWrap],
  BoxFlexWrap[keyof BoxFlexWrap]?,
  BoxFlexWrap[keyof BoxFlexWrap]?,
  BoxFlexWrap[keyof BoxFlexWrap]?,
];

export type BoxTextAlign = typeof TEXT_ALIGN;
export type BoxTextAlignArray = [
  BoxTextAlign[keyof BoxTextAlign],
  BoxTextAlign[keyof BoxTextAlign]?,
  BoxTextAlign[keyof BoxTextAlign]?,
  BoxTextAlign[keyof BoxTextAlign]?,
];

export type BoxDisplay = typeof DISPLAY;
export type BoxDisplayArray = [
  BoxDisplay[keyof BoxDisplay],
  BoxDisplay[keyof BoxDisplay]?,
  BoxDisplay[keyof BoxDisplay]?,
  BoxDisplay[keyof BoxDisplay]?,
];

export type BoxWidth = typeof BLOCK_SIZES;
export type BoxWidthArray = [
  BoxWidth[keyof BoxWidth],
  BoxWidth[keyof BoxWidth]?,
  BoxWidth[keyof BoxWidth]?,
  BoxWidth[keyof BoxWidth]?,
];

export type BoxHeight = typeof BLOCK_SIZES;
export type BoxHeightArray = [
  BoxHeight[keyof BoxHeight],
  BoxHeight[keyof BoxHeight]?,
  BoxHeight[keyof BoxHeight]?,
  BoxHeight[keyof BoxHeight]?,
];

export type SizeNumber =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | null
  | undefined;

export type Size =
  | SizeNumber
  | [SizeNumber, SizeNumber?, SizeNumber?, SizeNumber?];

export interface BoxProps {
  children?: React.ReactNode;
  flexDirection?:
    | BoxFlexDirection[keyof BoxFlexDirection]
    | BoxFlexDirectionArray;
  flexWrap?: BoxFlexWrap[keyof BoxFlexWrap] | BoxFlexWrapArray;
  gap?: Size;
  margin?: Size;
  marginTop?: Size;
  marginBottom?: Size;
  marginRight?: Size;
  marginLeft?: Size;
  marginInline?: Size;
  marginInlineStart?: Size;
  marginInlineEnd?: Size;
  padding?: Size;
  paddingTop?: Size;
  paddingBottom?: Size;
  paddingRight?: Size;
  paddingLeft?: Size;
  paddingInline?: Size;
  paddingInlineStart?: Size;
  paddingInlineEnd?: Size;
  borderColor?: BorderColor;
  borderWidth?: Size;
  borderRadius?: BorderRadius;
  borderStyle?: BorderStyle;
  alignItems?: AlignItems;
  justifyContent?: JustifyContent;
  textAlign?: BoxTextAlign[keyof BoxTextAlign] | BoxTextAlignArray;
  display?: BoxDisplay[keyof BoxDisplay] | BoxDisplayArray;
  width?: BoxWidth[keyof BoxWidth] | BoxWidthArray;
  height?: BoxHeight[keyof BoxHeight] | BoxHeightArray;
  backgroundColor?: BackgroundColor;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof HTMLElementTagNameMap;
  color?: TextColor | IconColor | string; // TODO: remove string when someone smarter figures out the issue with the color prop
}

declare const Box: React.FC<BoxProps>;
export default Box;
