import React from 'react';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Color,
  Display,
  FlexDirection,
  FlexWrap,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';

export type StyleDeclarationType =
  | 'margin'
  | 'margin-top'
  | 'margin-right'
  | 'margin-bottom'
  | 'margin-left'
  | 'margin-inline'
  | 'margin-inline-start'
  | 'margin-inline-end'
  | 'padding'
  | 'padding-top'
  | 'padding-right'
  | 'padding-bottom'
  | 'padding-left'
  | 'padding-inline'
  | 'padding-inline-start'
  | 'padding-inline-end'
  | 'display'
  | 'gap'
  | 'flex-direction'
  | 'flex-wrap'
  | 'justify-content'
  | 'align-items'
  | 'text-align'
  | 'width'
  | 'height'
  | 'color'
  | 'background-color'
  | 'rounded'
  | 'border-style'
  | 'border-color'
  | 'border-width';

export type StylePropValueType =
  | AlignItems
  | AlignItemsArray
  | BackgroundColor
  | BackgroundColorArray
  | BlockSize
  | BlockSizeArray
  | BorderColor
  | BorderColorArray
  | BorderRadius
  | BorderRadiusArray
  | BorderStyle
  | BorderStyleArray
  | Color
  | Display
  | DisplayArray
  | FlexDirection
  | FlexDirectionArray
  | FlexWrap
  | FlexWrapArray
  | IconColor
  | JustifyContent
  | JustifyContentArray
  | SizeNumberAndAuto
  | SizeNumberAndAutoArray
  | TextAlign
  | TextAlignArray
  | TextColor
  | TextColorArray
  | IconColor
  | IconColorArray
  | undefined;

export interface ClassNamesObject {
  [key: string]: any;
}

export type FlexDirectionArray = [
  FlexDirection,
  FlexDirection?,
  FlexDirection?,
  FlexDirection?,
];
export type FlexWrapArray = [FlexWrap, FlexWrap?, FlexWrap?, FlexWrap?];
export type TextAlignArray = [TextAlign, TextAlign?, TextAlign?, TextAlign?];
export type DisplayArray = [Display, Display?, Display?, Display?];
export type BlockSizeArray = [BlockSize, BlockSize?, BlockSize?, BlockSize?];

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

export type TextColorArray = [TextColor, TextColor?, TextColor?, TextColor?];

export type IconColorArray = [IconColor, IconColor?, IconColor?, IconColor?];

/**
 * Polymorphic props based on Ohans Emmanuel's article below
 * https://blog.logrocket.com/build-strongly-typed-polymorphic-components-react-typescript/#ensuring-as-prop-only-receives-valid-html-element-strings
 */

/**
 * Uses generic type C to create polymorphic ref type
 */
export type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>['ref'];

/**
 * Uses generic type C to define the type for the polymorphic "as" prop
 * "as" can be used to override the default HTML element
 */
type AsProp<C extends React.ElementType> = {
  /**
   * An override of the default HTML tag.
   * Can also be a React component.
   */
  as?: C;
};

/**
 * Omits the as prop and props from component definition
 */
type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

/**
 * Accepts 2 generic types: C which represents the as prop and the component props - Props
 */
type PolymorphicComponentProp<
  C extends React.ElementType,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Props = {},
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

export type PolymorphicComponentPropWithRef<
  C extends React.ElementType,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Props = {},
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };

/**
 * Includes all style utility props. This should be used to extend the props of a component.
 */
export interface StyleUtilityProps {
  /**
   * The flex direction of the Box component.
   * Use the FlexDirection enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  flexDirection?: FlexDirection | FlexDirectionArray;
  /**
   * The flex wrap of the Box component.
   * Use the FlexWrap enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  flexWrap?: FlexWrap | FlexWrapArray;
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
  textAlign?: TextAlign | TextAlignArray;
  /**
   * The display of the Box component.
   * Use Display enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  display?: Display | DisplayArray;
  /**
   * The width of the Box component.
   * Use BlockSize enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  width?: BlockSize | BlockSizeArray;
  /**
   * The height of the Box component.
   * Use BlockSize enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  height?: BlockSize | BlockSizeArray;
  /**
   * The background-color of the Box component.
   * Use BackgroundColor enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  backgroundColor?: BackgroundColor | BackgroundColorArray;
  /**
   * The text-color of the Box component.
   * Use TextColor enum from '../../../helpers/constants/design-system';
   * Accepts responsive props in the form of an array.
   */
  color?: TextColor | TextColorArray | IconColor | IconColorArray;
}
/**
 * Box component props.
 */
interface Props extends StyleUtilityProps {
  /**
   * The content of the Box component.
   */
  children?: React.ReactNode;
  /**
   * Additional className to apply to the Box component.
   */
  className?: string;
}

export type BoxProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, Props>;

export type BoxComponent = <C extends React.ElementType = 'span'>(
  props: BoxProps<C>,
) => React.ReactElement | null;
