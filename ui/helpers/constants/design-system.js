/**
 * A note about the existence of both singular and plural variable names here:
 * When dealing with a literal property name, e.g. ALIGN_ITEMS, the constant
 * should match the property. When detailing a collection of things, it should
 * match the plural form of the thing. e.g. COLORS, TYPOGRAPHY
 */
export const COLORS = {
  UI1: 'ui-1',
  UI2: 'ui-2',
  UI3: 'ui-3',
  UI4: 'ui-4',
  BLACK: 'black',
  WHITE: 'white',
  PRIMARY1: 'primary-1',
  PRIMARY2: 'primary-2',
  PRIMARY3: 'primary-3',
  SECONDARY1: 'secondary-1',
  SECONDARY2: 'secondary-2',
  SECONDARY3: 'secondary-3',
  SUCCESS1: 'success-1',
  SUCCESS2: 'success-2',
  SUCCESS3: 'success-3',
  ERROR1: 'error-1',
  ERROR2: 'error-2',
  ERROR3: 'error-3',
  ALERT1: 'alert-1',
  ALERT2: 'alert-2',
  ALERT3: 'alert-3',
  MAINNET: 'mainnet',
  ROPSTEN: 'ropsten',
  KOVAN: 'kovan',
  RINKEBY: 'rinkeby',
  GOERLI: 'goerli',
  TRANSPARENT: 'transparent',
};

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
  Paragraph: 'paragraph',
};

const NONE = 'none';

export const SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  NONE,
};

export const BORDER_STYLE = {
  DASHED: 'dashed',
  SOLID: 'solid',
  DOTTED: 'dotted',
  DOUBLE: 'double',
  NONE,
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

export const DISPLAY = {
  BLOCK: 'block',
  FLEX: 'flex',
  GRID: 'grid',
  INLINE_BLOCK: 'inline-block',
  INLINE_FLEX: 'inline-flex',
  INLINE_GRID: 'inline-grid',
  LIST_ITEM: 'list-item',
};

const FRACTIONS = {
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

export const FONT_WEIGHT = {
  BOLD: 'bold',
  NORMAL: 'normal',
  100: 100,
  200: 200,
  300: 300,
  400: 400,
  500: 500,
  600: 600,
  700: 700,
  800: 800,
  900: 900,
};

export const SEVERITIES = {
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
};
