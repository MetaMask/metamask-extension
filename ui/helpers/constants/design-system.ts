/**
 * A note about the existence of both singular and plural variable names here:
 * When dealing with a literal property name, e.g. AlignItems, the constant
 * should match the property. When detailing a collection of things, it should
 * match the plural form of the thing. e.g. Color, TypographyVariant
 */

export enum Color {
  backgroundDefault = 'background-default',
  backgroundAlternative = 'background-alternative',
  textDefault = 'text-default',
  textAlternative = 'text-alternative',
  textMuted = 'text-muted',
  iconDefault = 'icon-default',
  iconAlternative = 'icon-alternative',
  iconMuted = 'icon-muted',
  borderDefault = 'border-default',
  borderMuted = 'border-muted',
  overlayDefault = 'overlay-default',
  overlayInverse = 'overlay-inverse',
  primaryDefault = 'primary-default',
  primaryAlternative = 'primary-alternative',
  primaryMuted = 'primary-muted',
  primaryInverse = 'primary-inverse',
  primaryDisabled = 'primary-disabled',
  errorDefault = 'error-default',
  errorAlternative = 'error-alternative',
  errorMuted = 'error-muted',
  errorInverse = 'error-inverse',
  errorDisabled = 'error-disabled',
  warningDefault = 'warning-default',
  warningAlternative = 'warning-alternative',
  warningMuted = 'warning-muted',
  warningInverse = 'warning-inverse',
  warningDisabled = 'warning-disabled',
  successDefault = 'success-default',
  successAlternative = 'success-alternative',
  successMuted = 'success-muted',
  successInverse = 'success-inverse',
  successDisabled = 'success-disabled',
  infoDefault = 'info-default',
  infoAlternative = 'info-alternative',
  infoMuted = 'info-muted',
  infoInverse = 'info-inverse',
  infoDisabled = 'info-disabled',
  mainnet = 'mainnet',
  goerli = 'goerli',
  sepolia = 'sepolia',
  lineaTestnet = 'lineatestnet',
  lineaTestnetInverse = 'lineatestnet-inverse',
  transparent = 'transparent',
  localhost = 'localhost',
  inherit = 'inherit',
  goerliInverse = 'goerli-inverse',
  sepoliaInverse = 'sepolia-inverse',
}

export enum BackgroundColor {
  backgroundDefault = 'background-default',
  backgroundAlternative = 'background-alternative',
  overlayDefault = 'overlay-default',
  primaryDefault = 'primary-default',
  primaryAlternative = 'primary-alternative',
  primaryMuted = 'primary-muted',
  errorDefault = 'error-default',
  errorAlternative = 'error-alternative',
  errorMuted = 'error-muted',
  warningDefault = 'warning-default',
  warningAlternative = 'warning-alternative',
  warningMuted = 'warning-muted',
  successDefault = 'success-default',
  successAlternative = 'success-alternative',
  successMuted = 'success-muted',
  infoDefault = 'info-default',
  infoAlternative = 'info-alternative',
  infoMuted = 'info-muted',
  mainnet = 'mainnet',
  goerli = 'goerli',
  sepolia = 'sepolia',
  lineaTestnet = 'lineatestnet',
  transparent = 'transparent',
  localhost = 'localhost',
}

export enum BorderColor {
  borderDefault = 'border-default',
  borderMuted = 'border-muted',
  primaryDefault = 'primary-default',
  primaryAlternative = 'primary-alternative',
  primaryMuted = 'primary-muted',
  errorDefault = 'error-default',
  errorAlternative = 'error-alternative',
  errorMuted = 'error-muted',
  warningDefault = 'warning-default',
  warningAlternative = 'warning-alternative',
  warningMuted = 'warning-muted',
  successDefault = 'success-default',
  successAlternative = 'success-alternative',
  successMuted = 'success-muted',
  infoDefault = 'info-default',
  infoAlternative = 'info-alternative',
  infoMuted = 'info-muted',
  mainnet = 'mainnet',
  goerli = 'goerli',
  sepolia = 'sepolia',
  lineaTestnet = 'lineatestnet',
  transparent = 'transparent',
  localhost = 'localhost',
}

export enum TextColor {
  textDefault = 'text-default',
  textAlternative = 'text-alternative',
  textMuted = 'text-muted',
  overlayInverse = 'overlay-inverse',
  primaryDefault = 'primary-default',
  primaryInverse = 'primary-inverse',
  errorDefault = 'error-default',
  errorInverse = 'error-inverse',
  successDefault = 'success-default',
  successInverse = 'success-inverse',
  warningDefault = 'warning-default',
  warningInverse = 'warning-inverse',
  infoDefault = 'info-default',
  infoInverse = 'info-inverse',
  inherit = 'inherit',
  goerli = 'goerli',
  sepolia = 'sepolia',
  lineaTestnet = 'lineatestnet',
  lineaTestnetInverse = 'lineatestnet-inverse',
  goerliInverse = 'goerli-inverse',
  sepoliaInverse = 'sepolia-inverse',
  transparent = 'transparent',
}

export enum IconColor {
  iconDefault = 'icon-default',
  iconAlternative = 'icon-alternative',
  iconMuted = 'icon-muted',
  overlayInverse = 'overlay-inverse',
  primaryDefault = 'primary-default',
  primaryInverse = 'primary-inverse',
  errorDefault = 'error-default',
  errorInverse = 'error-inverse',
  successDefault = 'success-default',
  successInverse = 'success-inverse',
  warningDefault = 'warning-default',
  warningInverse = 'warning-inverse',
  infoDefault = 'info-default',
  infoInverse = 'info-inverse',
  inherit = 'inherit',
  goerli = 'goerli',
  sepolia = 'sepolia',
  lineaTestnet = 'lineatestnet',
  lineaTestnetInverse = 'lineatestnet-inverse',
  goerliInverse = 'goerli-inverse',
  sepoliaInverse = 'sepolia-inverse',
}

export enum TypographyVariant {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6',
  H7 = 'h7',
  H8 = 'h8',
  H9 = 'h9',
  paragraph = 'p',
  span = 'span',
}

export enum TextVariant {
  displayMd = 'display-md',
  headingLg = 'heading-lg',
  headingMd = 'heading-md',
  headingSm = 'heading-sm',
  bodyLgMedium = 'body-lg-medium',
  bodyMd = 'body-md',
  bodyMdBold = 'body-md-bold',
  bodySm = 'body-sm',
  bodySmBold = 'body-sm-bold',
  bodyXs = 'body-xs',
  inherit = 'inherit',
}

export enum Size {
  XXS = 'xxs',
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  inherit = 'inherit', // Used for Text, Icon, and Button components to inherit the parent elements font-size
  auto = 'auto',
  none = 'none',
}

export enum BorderStyle {
  dashed = 'dashed',
  solid = 'solid',
  dotted = 'dotted',
  double = 'double',
  none = 'none',
}

export enum BorderRadius {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  none = 'none',
  pill = 'pill',
  full = 'full',
}

// NOTE: The name of this enum is plural due to the name of property in css is `align-items`,
// which is for aligning all items not one
export enum AlignItems {
  flexStart = 'flex-start',
  flexEnd = 'flex-end',
  center = 'center',
  baseline = 'baseline',
  stretch = 'stretch',
}

export enum JustifyContent {
  flexStart = 'flex-start',
  flexEnd = 'flex-end',
  center = 'center',
  spaceAround = 'space-around',
  spaceBetween = 'space-between',
  spaceEvenly = 'space-evenly',
}

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

export enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',
  End = 'end',
  Start = 'start',
}

/**
 * @deprecated `TEXT_ALIGN` const has been deprecated in favour of the `TextAlign` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `TEXT_ALIGN` with `TextAlign` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const TEXT_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify',
  END: 'end',
  START: 'start',
};

export enum TextTransform {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Uppercase = 'uppercase',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Lowercase = 'lowercase',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Capitalize = 'capitalize',
}

/**
 * @deprecated `TEXT_TRANSFORM` const has been deprecated in favour of the `TextTransform` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `TEXT_TRANSFORM` with `TextTransform` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const TEXT_TRANSFORM = {
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
};

export enum FontWeight {
  Bold = 'bold',
  Medium = 'medium',
  Normal = 'normal',
}

/**
 * @deprecated `FONT_WEIGHT` const has been deprecated in favour of the `FontWeight` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `FONT_WEIGHT` with `FontWeight` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const FONT_WEIGHT = {
  BOLD: 'bold',
  MEDIUM: 'medium',
  NORMAL: 'normal',
};

export enum OverflowWrap {
  BreakWord = 'break-word',
  Anywhere = 'anywhere',
  Normal = 'normal',
}

/**
 * @deprecated `OVERFLOW_WRAP` const has been deprecated in favour of the `OverflowWrap` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `OVERFLOW_WRAP` with `OverflowWrap` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const OVERFLOW_WRAP = {
  BREAK_WORD: 'break-word',
  ANYWHERE: 'anywhere',
  NORMAL: 'normal',
};

export enum FontStyle {
  Italic = 'italic',
  Normal = 'normal',
}

/**
 * @deprecated `FONT_STYLE` const has been deprecated in favour of the `FontStyle` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `FONT_STYLE` with `FontStyle` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const FONT_STYLE = {
  ITALIC: 'italic',
  NORMAL: 'normal',
};

export enum Severity {
  Danger = 'danger',
  Warning = 'warning',
  Info = 'info',
  Success = 'success',
}

/**
 * @deprecated `SEVERITIES` const has been deprecated in favour of the `Severity` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * This `SEVERITIES` object can be removed once the migration from banner-alert.js to TS is done.
 */
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
