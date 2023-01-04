/**
 * A note about the existence of both singular and plural variable names here:
 * When dealing with a literal property name, e.g. ALIGN_ITEMS, the constant
 * should match the property. When detailing a collection of things, it should
 * match the plural form of the thing. e.g. COLORS, TYPOGRAPHY
 */

import { pick } from 'lodash';

export const COLORS = {
  BACKGROUND_DEFAULT: 'background-default',
  BACKGROUND_ALTERNATIVE: 'background-alternative',
  TEXT_DEFAULT: 'text-default',
  TEXT_ALTERNATIVE: 'text-alternative',
  TEXT_MUTED: 'text-muted',
  ICON_DEFAULT: 'icon-default',
  ICON_ALTERNATIVE: 'icon-alternative',
  ICON_MUTED: 'icon-muted',
  BORDER_DEFAULT: 'border-default',
  BORDER_MUTED: 'border-muted',
  OVERLAY_DEFAULT: 'overlay-default',
  OVERLAY_INVERSE: 'overlay-inverse',
  PRIMARY_DEFAULT: 'primary-default',
  PRIMARY_ALTERNATIVE: 'primary-alternative',
  PRIMARY_MUTED: 'primary-muted',
  PRIMARY_INVERSE: 'primary-inverse',
  PRIMARY_DISABLED: 'primary-disabled',
  ERROR_DEFAULT: 'error-default',
  ERROR_ALTERNATIVE: 'error-alternative',
  ERROR_MUTED: 'error-muted',
  ERROR_INVERSE: 'error-inverse',
  ERROR_DISABLED: 'error-disabled',
  WARNING_DEFAULT: 'warning-default',
  WARNING_ALTERNATIVE: 'warning-alternative',
  WARNING_MUTED: 'warning-muted',
  WARNING_INVERSE: 'warning-inverse',
  WARNING_DISABLED: 'warning-disabled',
  SUCCESS_DEFAULT: 'success-default',
  SUCCESS_ALTERNATIVE: 'success-alternative',
  SUCCESS_MUTED: 'success-muted',
  SUCCESS_INVERSE: 'success-inverse',
  SUCCESS_DISABLED: 'success-disabled',
  INFO_DEFAULT: 'info-default',
  INFO_ALTERNATIVE: 'info-alternative',
  INFO_MUTED: 'info-muted',
  INFO_INVERSE: 'info-inverse',
  INFO_DISABLED: 'info-disabled',
  MAINNET: 'mainnet',
  GOERLI: 'goerli',
  SEPOLIA: 'sepolia',
  LOCALHOST: 'localhost',
  TRANSPARENT: 'transparent',
  INHERIT: 'inherit',
  GOERLI_INVERSE: 'goerli-inverse',
  SEPOLIA_INVERSE: 'sepolia-inverse',
};
export const BACKGROUND_COLORS = pick(COLORS, [
  'BACKGROUND_DEFAULT',
  'BACKGROUND_ALTERNATIVE',
  'OVERLAY_DEFAULT',
  'PRIMARY_DEFAULT',
  'PRIMARY_ALTERNATIVE',
  'PRIMARY_MUTED',
  'ERROR_DEFAULT',
  'ERROR_ALTERNATIVE',
  'ERROR_MUTED',
  'WARNING_DEFAULT',
  'WARNING_ALTERNATIVE',
  'WARNING_MUTED',
  'SUCCESS_DEFAULT',
  'SUCCESS_ALTERNATIVE',
  'SUCCESS_MUTED',
  'INFO_DEFAULT',
  'INFO_ALTERNATIVE',
  'INFO_MUTED',
  'MAINNET',
  'GOERLI',
  'SEPOLIA',
  'TRANSPARENT',
  'LOCALHOST',
]);

export const BORDER_COLORS = pick(COLORS, [
  'BORDER_DEFAULT',
  'BORDER_MUTED',
  'PRIMARY_DEFAULT',
  'PRIMARY_ALTERNATIVE',
  'PRIMARY_MUTED',
  'ERROR_DEFAULT',
  'ERROR_ALTERNATIVE',
  'ERROR_MUTED',
  'WARNING_DEFAULT',
  'WARNING_ALTERNATIVE',
  'WARNING_MUTED',
  'SUCCESS_DEFAULT',
  'SUCCESS_ALTERNATIVE',
  'SUCCESS_MUTED',
  'INFO_DEFAULT',
  'INFO_ALTERNATIVE',
  'INFO_MUTED',
  'MAINNET',
  'GOERLI',
  'SEPOLIA',
  'TRANSPARENT',
  'LOCALHOST',
]);

export const TEXT_COLORS = pick(COLORS, [
  'TEXT_DEFAULT',
  'TEXT_ALTERNATIVE',
  'TEXT_MUTED',
  'OVERLAY_INVERSE',
  'PRIMARY_DEFAULT',
  'PRIMARY_INVERSE',
  'ERROR_DEFAULT',
  'ERROR_INVERSE',
  'SUCCESS_DEFAULT',
  'SUCCESS_INVERSE',
  'WARNING_DEFAULT',
  'WARNING_INVERSE',
  'INFO_DEFAULT',
  'INFO_INVERSE',
  'INHERIT',
  'GOERLI',
  'SEPOLIA',
  'GOERLI_INVERSE',
  'SEPOLIA_INVERSE',
]);

export const ICON_COLORS = pick(COLORS, [
  'ICON_DEFAULT',
  'ICON_ALTERNATIVE',
  'ICON_MUTED',
  'OVERLAY_INVERSE',
  'PRIMARY_DEFAULT',
  'PRIMARY_INVERSE',
  'ERROR_DEFAULT',
  'ERROR_INVERSE',
  'SUCCESS_DEFAULT',
  'SUCCESS_INVERSE',
  'WARNING_DEFAULT',
  'WARNING_INVERSE',
  'INFO_DEFAULT',
  'INFO_INVERSE',
  'INHERIT',
  'GOERLI',
  'SEPOLIA',
  'GOERLI_INVERSE',
  'SEPOLIA_INVERSE',
]);

export const TYPOGRAPHY = {
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  H5: 'h5',
  H6: 'h6',
  H7: 'h7',
  H8: 'h8',
  H9: 'h9',
  Paragraph: 'p',
  Span: 'span',
};

export const TEXT = {
  DISPLAY_MD: 'display-md',
  HEADING_LG: 'heading-lg',
  HEADING_MD: 'heading-md',
  HEADING_SM: 'heading-sm',
  BODY_LG_MEDIUM: 'body-lg-medium',
  BODY_MD: 'body-md',
  BODY_MD_BOLD: 'body-md-bold',
  BODY_SM: 'body-sm',
  BODY_SM_BOLD: 'body-sm-bold',
  BODY_XS: 'body-xs',
  INHERIT: 'inherit',
};

const NONE = 'none';

export const SIZES = {
  XXS: 'xxs',
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  INHERIT: 'inherit', // Used for Text, Icon, and Button components to inherit the parent elements font-size
  AUTO: 'auto',
  NONE,
};

export const BORDER_STYLE = {
  DASHED: 'dashed',
  SOLID: 'solid',
  DOTTED: 'dotted',
  DOUBLE: 'double',
  NONE,
};

export const BORDER_RADIUS = {
  XS: SIZES.XS,
  SM: SIZES.SM,
  MD: SIZES.MD,
  LG: SIZES.LG,
  XL: SIZES.XL,
  NONE,
  PILL: 'pill',
  FULL: 'full',
};

const FLEX_END = 'flex-end';
const FLEX_START = 'flex-start';
const CENTER = 'center';

export const ALIGN_ITEMS = {
  FLEX_START,
  FLEX_END,
  CENTER,
  BASELINE: 'baseline',
  STRETCH: 'stretch',
};

export const JUSTIFY_CONTENT = {
  FLEX_START,
  FLEX_END,
  CENTER,
  SPACE_AROUND: 'space-around',
  SPACE_BETWEEN: 'space-between',
  SPACE_EVENLY: 'space-evenly',
};

export const FLEX_DIRECTION = {
  ROW: 'row',
  ROW_REVERSE: 'row-reverse',
  COLUMN: 'column',
  COLUMN_REVERSE: 'column-reverse',
};

export const FLEX_WRAP = {
  WRAP: 'wrap',
  WRAP_REVERSE: 'wrap-reverse',
  NO_WRAP: 'nowrap',
};

export const DISPLAY = {
  BLOCK: 'block',
  FLEX: 'flex',
  GRID: 'grid',
  INLINE_BLOCK: 'inline-block',
  INLINE: 'inline',
  INLINE_FLEX: 'inline-flex',
  INLINE_GRID: 'inline-grid',
  LIST_ITEM: 'list-item',
  NONE: 'none',
};

export const FRACTIONS = {
  HALF: '1/2',
  ONE_THIRD: '1/3',
  TWO_THIRDS: '2/3',
  ONE_FOURTH: '1/4',
  TWO_FOURTHS: '2/4',
  THREE_FOURTHS: '3/4',
  ONE_FIFTH: '1/5',
  TWO_FIFTHS: '2/5',
  THREE_FIFTHS: '3/5',
  FOUR_FIFTHS: '4/5',
  ONE_SIXTH: '1/6',
  TWO_SIXTHS: '2/6',
  THREE_SIXTHS: '3/6',
  FOUR_SIXTHS: '4/6',
  FIVE_SIXTHS: '5/6',
  ONE_TWELFTH: '1/12',
  TWO_TWELFTHS: '2/12',
  THREE_TWELFTHS: '3/12',
  FOUR_TWELFTHS: '4/12',
  FIVE_TWELFTHS: '5/12',
  SIX_TWELFTHS: '6/12',
  SEVEN_TWELFTHS: '7/12',
  EIGHT_TWELFTHS: '8/12',
  NINE_TWELFTHS: '9/12',
  TEN_TWELFTHS: '10/12',
  ELEVEN_TWELFTHS: '11/12',
};

export const BLOCK_SIZES = {
  ...FRACTIONS,
  SCREEN: 'screen',
  MAX: 'max',
  MIN: 'min',
  FULL: 'full',
};

export const TEXT_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify',
  END: 'end',
};

export const TEXT_TRANSFORM = {
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
};

export const FONT_WEIGHT = {
  BOLD: 'bold',
  MEDIUM: 'medium',
  NORMAL: 'normal',
};

export const OVERFLOW_WRAP = {
  BREAK_WORD: 'break-word',
  ANYWHERE: 'anywhere',
  NORMAL: 'normal',
};

export const FONT_STYLE = {
  ITALIC: 'italic',
  NORMAL: 'normal',
};

export const SEVERITIES = {
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
};

export const RESIZE = {
  NONE: 'none',
  BOTH: 'both',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  INITIAL: 'initial',
  INHERIT: 'inherit',
};

export const BREAKPOINTS = ['base', 'sm', 'md', 'lg'];
