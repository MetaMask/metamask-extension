import { TextProps, ValidTagType } from '../text/text.types';
import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';
import { IconName, IconProps } from '../icon';

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
  /**
   * The name of the icon to be used in the Tag component
   */
  startIconName?: IconName;
  /**
   * The icon props of the component. Most Icon component props can be used
   */
  startIconProps?: Omit<IconProps<'span'>, 'name'>;
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
