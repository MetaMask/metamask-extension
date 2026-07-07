import type {
  IconName,
  IconSize,
  TextVariant,
} from '@metamask/design-system-react';
import { TextProps, ValidTagType } from '../text/text.types';
import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';
import { IconName as IconNameLegacy, IconProps } from '../icon';
import {
  IconColor as IconColorLegacy,
  TextVariant as TextVariantLegacy,
} from '../../../helpers/constants/design-system';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface TagStyleUtilityProps extends StyleUtilityProps {
  /**
   * The text content of the Tag component, can either be a string or ReactNode
   */
  label?: string | React.ReactNode;
  /**
   * The label props of the component. Most Text component props can be used
   */
  labelProps?: TextProps<ValidTagType>;
  /**
   * Additional classNames to be added to the Tag component
   */
  className?: string;
  // Legacy props from component-library (kept for backward compatibility)
  /**
   * @deprecated Use `iconName` from @metamask/design-system-react instead
   */
  startIconName?: IconNameLegacy;
  /**
   * @deprecated Use `iconName` from @metamask/design-system-react instead. Alias for `startIconName` for consistency with MenuItem.
   */
  iconNameLegacy?: IconNameLegacy;
  /**
   * @deprecated Use `iconSize` from @metamask/design-system-react instead
   */
  iconColorLegacy?: IconColorLegacy;
  /**
   * @deprecated Use `textVariant` from @metamask/design-system-react instead
   */
  textVariantLegacy?: TextVariantLegacy;
  /**
   * The icon props of the component. Most Icon component props can be used
   */
  startIconProps?: Omit<IconProps<'span'>, 'name'>;
  // New props from @metamask/design-system-react
  /**
   * The name of the icon to be used in the Tag component (from @metamask/design-system-react)
   */
  iconName?: IconName;
  /**
   * The size of the icon (from @metamask/design-system-react)
   */
  iconSize?: IconSize;
  /**
   * The text variant for the label (from @metamask/design-system-react)
   */
  textVariant?: TextVariant;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type TagProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TagStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type TagComponent = <C extends React.ElementType = 'div'>(
  props: TagProps<C>,
) => React.ReactElement | null;
