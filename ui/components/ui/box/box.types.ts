import React from 'react';

export enum COLORS {
  BACKGROUND_DEFAULT = 'background-default',
  BACKGROUND_ALTERNATIVE = 'background-alternative',
  TEXT_DEFAULT = 'text-default',
  TEXT_ALTERNATIVE = 'text-alternative',
  TEXT_MUTED = 'text-muted',
  ICON_DEFAULT = 'icon-default',
  ICON_ALTERNATIVE = 'icon-alternative',
  ICON_MUTED = 'icon-muted',
  BORDER_DEFAULT = 'border-default',
  BORDER_MUTED = 'border-muted',
  OVERLAY_DEFAULT = 'overlay-default',
  OVERLAY_INVERSE = 'overlay-inverse',
  PRIMARY_DEFAULT = 'primary-default',
  PRIMARY_ALTERNATIVE = 'primary-alternative',
  PRIMARY_MUTED = 'primary-muted',
  PRIMARY_INVERSE = 'primary-inverse',
  PRIMARY_DISABLED = 'primary-disabled',
  ERROR_DEFAULT = 'error-default',
  ERROR_ALTERNATIVE = 'error-alternative',
  ERROR_MUTED = 'error-muted',
  ERROR_INVERSE = 'error-inverse',
  ERROR_DISABLED = 'error-disabled',
  WARNING_DEFAULT = 'warning-default',
  WARNING_ALTERNATIVE = 'warning-alternative',
  WARNING_MUTED = 'warning-muted',
  WARNING_INVERSE = 'warning-inverse',
  WARNING_DISABLED = 'warning-disabled',
  SUCCESS_DEFAULT = 'success-default',
  SUCCESS_ALTERNATIVE = 'success-alternative',
  SUCCESS_MUTED = 'success-muted',
  SUCCESS_INVERSE = 'success-inverse',
  SUCCESS_DISABLED = 'success-disabled',
  INFO_DEFAULT = 'info-default',
  INFO_ALTERNATIVE = 'info-alternative',
  INFO_MUTED = 'info-muted',
  INFO_INVERSE = 'info-inverse',
  INFO_DISABLED = 'info-disabled',
  MAINNET = 'mainnet',
  GOERLI = 'goerli',
  SEPOLIA = 'sepolia',
  LOCALHOST = 'localhost',
  TRANSPARENT = 'transparent',
  INHERIT = 'inherit',
}

export enum ALIGN_ITEMS {
  FLEX_START = 'flex-start',
  FLEX_END = 'flex-end',
  CENTER = 'center',
  BASELINE = 'baseline',
  STRETCH = 'stretch',
}

export enum FLEX_DIRECTION {
  ROW = 'row',
  ROW_REVERSE = 'row-reverse',
  COLUMN = 'column',
  COLUMN_REVERSE = 'column-reverse',
}

export enum FLEX_WRAP {
  WRAP = 'wrap',
  WRAP_REVERSE = 'wrap-reverse',
  NO_WRAP = 'nowrap',
}

export type Sizes = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type SizesAndAuto = Sizes | 'auto';

export interface BoxProps {
  children?: React.ReactChild;
  flexDirection?: FLEX_DIRECTION | FLEX_DIRECTION[];
  flexWrap?: FLEX_WRAP | FLEX_WRAP[];
  gap?: Sizes | Sizes[];
  margin: SizesAndAuto | SizesAndAuto[];
  marginTop: SizesAndAuto | SizesAndAuto[];
  marginBottom: SizesAndAuto | SizesAndAuto[];
  marginRight: SizesAndAuto | SizesAndAuto[];
  marginLeft: SizesAndAuto | SizesAndAuto[];
  padding: Sizes | Sizes[];
  paddingTop: Sizes | Sizes[];
  paddingBottom: Sizes | Sizes[];
  paddingRight: Sizes | Sizes[];
  paddingLeft: Sizes | Sizes[];
  // borderColor: MultipleBorderColors,
  // borderWidth: PropTypes.oneOfType([
  //   PropTypes.number,
  //   PropTypes.arrayOf(PropTypes.number),
  // ]),
  // borderRadius: PropTypes.oneOfType([
  //   PropTypes.oneOf(Object.values(BORDER_RADIUS)),
  //   PropTypes.arrayOf(PropTypes.oneOf(Object.values(BORDER_RADIUS))),
  // ]),
  // borderStyle: PropTypes.oneOfType([
  //   PropTypes.oneOf(Object.values(BORDER_STYLE)),
  //   PropTypes.arrayOf(PropTypes.oneOf(Object.values(BORDER_STYLE))),
  // ]),
  // alignItems: MultipleAlignItems,
  // justifyContent: MultipleJustifyContents,
  // textAlign: PropTypes.oneOfType([
  //   PropTypes.oneOf(Object.values(TEXT_ALIGN)),
  //   PropTypes.arrayOf(PropTypes.oneOf(Object.values(TEXT_ALIGN))),
  // ]),
  // display: PropTypes.oneOfType([
  //   PropTypes.oneOf(Object.values(DISPLAY)),
  //   PropTypes.arrayOf(PropTypes.oneOf(Object.values(DISPLAY))),
  // ]),
  // width: MultipleBlockSizes,
  // height: MultipleBlockSizes,
  // backgroundColor: MultipleBackgroundColors,
  // className: PropTypes.string,
  // style: PropTypes.object,
  // /**
  //  * The polymorphic `as` prop allows you to change the root HTML element of the Box component
  //  * Defaults to 'div'
  //  */
  // as: PropTypes.string,
  // /**
  //  * The color of the Typography component Should use the COLOR object from
  //  * ./ui/helpers/constants/design-system.js
  //  */
  // color: MultipleTextColors,
}
