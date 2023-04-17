import { Size } from '../../../../helpers/constants/design-system';

/**
 * @deprecated `ICON_NAMES` has been deprecated in favour of the `IconName` enum
 *
 * import { Icon, IconName } from '../../component-library';
 */
/* eslint-disable prefer-destructuring*/ // process.env is not a standard JavaScript object, so we are not able to use object destructuring
export const ICON_NAMES = JSON.parse(process.env.ICON_NAMES);

/**
 * @deprecated `ICON_SIZES` has been deprecated in favour of the `IconSize` enum
 *
 * import { Icon, IconSize, IconName } from '../../component-library';
 */
export const ICON_SIZES = {
  XS: Size.XS,
  SM: Size.SM,
  MD: Size.MD,
  LG: Size.LG,
  XL: Size.XL,
  AUTO: Size.inherit,
};
