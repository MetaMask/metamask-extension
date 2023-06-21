import * as React from 'react';

import {
  AlignItems,
  BlockSize,
  BLOCK_SIZES,
  BorderStyle,
  BackgroundColor,
  BorderColor,
  TextColor,
  IconColor,
  Display,
  DISPLAY,
  JustifyContent,
  TextAlign,
  TEXT_ALIGN,
  FlexDirection,
  FLEX_DIRECTION,
  FlexWrap,
  FLEX_WRAP,
  BorderRadius,
} from '../../../helpers/constants/design-system';

export type BoxChildren = React.ReactNode | ((...args: any[]) => any);

export type FlexDirectionArray = [
  FlexDirection,
  FlexDirection?,
  FlexDirection?,
  FlexDirection?,
];

/**
 * @deprecated BoxFlexDirection is deprecated. Use FlexDirection instead.
 */
type BoxFlexDirection =
  | (typeof FLEX_DIRECTION)[keyof typeof FLEX_DIRECTION]
  | null;

/**
 * @deprecated BoxFlexDirectionArray is deprecated. Use FlexDirectionArray instead.
 */
type BoxFlexDirectionArray = [
  BoxFlexDirection,
  BoxFlexDirection?,
  BoxFlexDirection?,
  BoxFlexDirection?,
];

export type FlexWrapArray = [FlexWrap, FlexWrap?, FlexWrap?, FlexWrap?];

/**
 * @deprecated BoxFlexWrap is deprecated. Use FlexWrap instead.
 */
type BoxFlexWrap = (typeof FLEX_WRAP)[keyof typeof FLEX_WRAP] | null;

/**
 * @deprecated BoxFlexWrapArray is deprecated. Use FlexWrapArray instead.
 */
type BoxFlexWrapArray = [BoxFlexWrap, BoxFlexWrap?, BoxFlexWrap?, BoxFlexWrap?];

export type TextAlignArray = [TextAlign, TextAlign?, TextAlign?, TextAlign?];

/**
 * @deprecated BoxTextAlign is deprecated. Use TextAlign instead.
 */
type BoxTextAlign = (typeof TEXT_ALIGN)[keyof typeof TEXT_ALIGN] | null;
/**
 * @deprecated BoxTextAlignArray is deprecated. Use TextAlignArray instead.
 */
type BoxTextAlignArray = [
  BoxTextAlign,
  BoxTextAlign?,
  BoxTextAlign?,
  BoxTextAlign?,
];

export type DisplayArray = [Display, Display?, Display?, Display?];

/**
 * @deprecated BoxDisplay is deprecated. Use Display instead.
 */
type BoxDisplay = (typeof DISPLAY)[keyof typeof DISPLAY] | null;
/**
 * @deprecated BoxDisplayArray is deprecated. Use DisplayArray instead.
 */
type BoxDisplayArray = [BoxDisplay, BoxDisplay?, BoxDisplay?, BoxDisplay?];

export type BlockSizeArray = [BlockSize, BlockSize?, BlockSize?, BlockSize?];

/**
 * @deprecated BoxWidth is deprecated. Use BlockSize instead.
 */
export type BoxWidth = (typeof BLOCK_SIZES)[keyof typeof BLOCK_SIZES] | null;
/**
 * @deprecated BoxWidthArray is deprecated. Use BlockSizeArray instead.
 */
export type BoxWidthArray = [BoxWidth, BoxWidth?, BoxWidth?, BoxWidth?];

/**
 * @deprecated BoxHeight is deprecated. Use BlockSize instead.
 */
type BoxHeight = (typeof BLOCK_SIZES)[keyof typeof BLOCK_SIZES] | null;
/**
 * @deprecated BoxHeightArray is deprecated. Use BlockSizeArray instead.
 */
type BoxHeightArray = [BoxHeight, BoxHeight?, BoxHeight?, BoxHeight?];

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
  | null;

export type SizeNumberArray = [
  SizeNumber,
  SizeNumber?,
  SizeNumber?,
  SizeNumber?,
];

export type SizeNumberAndAuto = SizeNumber | 'auto';
export type SizeNumberAndAutoArray = [
  SizeNumberAndAuto,
  SizeNumberAndAuto?,
  SizeNumberAndAuto?,
  SizeNumberAndAuto?,
];

export type BorderColorArray = [
  BorderColor,
  BorderColor?,
  BorderColor?,
  BorderColor?,
];

export type BorderRadiusArray = [
  BorderRadius,
  BorderRadius?,
  BorderRadius?,
  BorderRadius?,
];

export type BorderStyleArray = [
  BorderStyle,
  BorderStyle?,
  BorderStyle?,
  BorderStyle?,
];

export type AlignItemsArray = [
  AlignItems,
  AlignItems?,
  AlignItems?,
  AlignItems?,
];

export type JustifyContentArray = [
  JustifyContent,
  JustifyContent?,
  JustifyContent?,
  JustifyContent?,
];

export type BackgroundColorArray = [
  BackgroundColor,
  BackgroundColor?,
  BackgroundColor?,
  BackgroundColor?,
];

/**
 * @deprecated BoxProps have been deprecated in favor of the component-library Box types.
 * This component should be migrated to use the component-library Box.
 * import { Box } from '../../component-library';
 *
 * Help to migrate this component by submitting a PR
 */
export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The content of the Box component.
   */
  children?: React.ReactNode;
  /**
   * The flex direction of the Box component.
   * Use the FLEX_DIRECTION object from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  flexDirection?:
    | FlexDirection
    | FlexDirectionArray
    | BoxFlexDirection
    | BoxFlexDirectionArray;
  /**
   * The flex wrap of the Box component.
   * Use the FLEX_WRAP object from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  flexWrap?: BoxFlexWrap | BoxFlexWrapArray;
  /**
   * The gap between the Box component's children.
   * Use 1-12 for a gap of 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  gap?: SizeNumber | SizeNumberArray | undefined;
  /**
   * The margin of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  margin?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The margin-top of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  marginTop?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The margin-bottom of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  marginBottom?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The margin-right of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  marginRight?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The margin-left of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  marginLeft?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The margin-inline of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  marginInline?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The margin-inline-start of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  marginInlineStart?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The margin-inline-end of the Box component.
   * Use 1-12 for 4px-48px or 'auto'.
   * Accepts responsive props in the form of an array.
   */
  marginInlineEnd?: SizeNumberAndAuto | SizeNumberAndAutoArray;
  /**
   * The padding of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  padding?: SizeNumber | SizeNumberArray;
  /**
   * The padding-top of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  paddingTop?: SizeNumber | SizeNumberArray;
  /**
   * The padding-bottom of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  paddingBottom?: SizeNumber | SizeNumberArray;
  /**
   * The padding-right of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  paddingRight?: SizeNumber | SizeNumberArray;
  /**
   * The padding-left of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  paddingLeft?: SizeNumber | SizeNumberArray;
  /**
   * The padding-inline of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  paddingInline?: SizeNumber | SizeNumberArray;
  /**
   * The padding-inline-start of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  paddingInlineStart?: SizeNumber | SizeNumberArray;
  /**
   * The padding-inline-end of the Box component.
   * Use 1-12 for 4px-48px.
   * Accepts responsive props in the form of an array.
   */
  paddingInlineEnd?: SizeNumber | SizeNumberArray;
  /**
   * The border-color of the Box component.
   * Use BorderColor enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  borderColor?: BorderColor | BorderColorArray;
  /**
   * The border-width of the Box component.
   * Use 1-12 for 1px-12px.
   * Accepts responsive props in the form of an array.
   */
  borderWidth?: SizeNumber | SizeNumberArray;
  /**
   * The border-radius of the Box component.
   * Use BorderRadius enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  borderRadius?: BorderRadius | BorderRadiusArray;
  /**
   * The border-style of the Box component.
   * Use BorderStyle enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  borderStyle?: BorderStyle | BorderStyleArray;
  /**
   * The align-items of the Box component.
   * Use AlignItems enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  alignItems?: AlignItems | AlignItemsArray;
  /**
   * The justify-content of the Box component.
   * Use JustifyContent enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  justifyContent?: JustifyContent | JustifyContentArray;
  /**
   * The text-align of the Box component.
   * Use TextAlign enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  textAlign?: BoxTextAlign | BoxTextAlignArray | TextAlign | TextAlignArray;
  /**
   * The display of the Box component.
   * Use DISPLAY const from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  display?: Display | DisplayArray | BoxDisplay | BoxDisplayArray;
  /**
   * The width of the Box component.
   * Use BLOCK_SIZES const from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  width?: BlockSize | BlockSizeArray | BoxWidth | BoxWidthArray;
  /**
   * The height of the Box component.
   * Use BLOCK_SIZES const from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  height?: BlockSize | BlockSizeArray | BoxHeight | BoxHeightArray;
  /**
   * The background-color of the Box component.
   * Use BackgroundColor enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  backgroundColor?: BackgroundColor | BackgroundColorArray;
  /**
   * Use the className prop to add an additional custom class to the Box component.
   */
  className?: string;
  /**
   * Use the style prop to add an additional custom style to the Box component.
   */
  style?: React.CSSProperties;
  /**
   * Use the as prop to change the underlying HTML element of the Box component.
   */
  as?: keyof HTMLElementTagNameMap;
  /**
   * The text-color of the Box component.
   * Use TextColor enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  color?: TextColor | IconColor | string; // TODO: remove string when someone smarter figures out the issue with the color prop
  /**
   * The ref of the Box component.
   */
  ref?: React.Ref<HTMLElement>;
}
/**
 * @deprecated The JS version of `<Box />` has been deprecated in favor of the TS version in `ui/components/component-library/`.
 * The component API should be the same, just update the import statement to:
 * import { Box } from '../../component-library';
 *
 * Help to replace the JS `Box` with the TS `Box` by submitting a PR against
 * {@link https://github.com/MetaMask/metamask-extension/issues/19526}
 */
declare const Box: React.FC<BoxProps>;
export default Box;
