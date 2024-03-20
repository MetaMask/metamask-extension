import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';
import { IconProps } from '../icon/icon.types';
import { AvatarNetworkProps } from '../avatar-network/avatar-network.types';
import { TextProps } from '../text';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface PickerNetworkStyleUtilityProps extends StyleUtilityProps {
  /**
   * The src accepts the string of the image to be rendered
   */
  src?: string;
  /**
   * An additional className to apply to the PickerNetwork.
   */
  className?: string;
  /**
   * It accepts all the props from AvatarNetwork
   */
  avatarNetworkProps?: AvatarNetworkProps<'span'>;
  /**
   * It accepts all the props from Icon
   */
  iconProps?: IconProps<'span'>;
  /**
   * The text content of the PickerNetwork component
   */
  label: string;
  /**
   * Additional props to pass to the label wrapper Text component
   */
  labelProps?: TextProps<'span'>;
}

export type PickerNetworkProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, PickerNetworkStyleUtilityProps>;

export type PickerNetworkComponent = <C extends React.ElementType = 'button'>(
  props: PickerNetworkProps<C>,
) => React.ReactElement | null;
