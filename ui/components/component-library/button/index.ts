import { Size } from '../../../helpers/constants/design-system';

export { Button } from './button';
export { ButtonSize, ButtonVariant } from './button.types';
export type { ButtonProps } from './button.types';

/**
 * @deprecated `BUTTON_SIZES` const has been deprecated in favor of the `ButtonSize` enum which can still be imported from `ui/components/component-library`
 */
export const BUTTON_SIZES = {
  SM: Size.SM,
  MD: Size.MD,
  LG: Size.LG,
  INHERIT: Size.inherit,
  AUTO: Size.auto,
};
/**
 * @deprecated `BUTTON_VARIANT` const has been deprecated in favor of the `ButtonVariant` enum which can still be imported from `ui/components/component-library`
 */
export const BUTTON_VARIANT = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  LINK: 'link',
};
