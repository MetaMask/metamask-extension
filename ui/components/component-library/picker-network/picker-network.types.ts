import { AvatarNetworkProps } from '../avatar-network';
import { BoxProps } from '../../ui/box';
import { IconProps } from '../icon';

interface PickerNetworkProps extends BoxProps {
  src?: string;
  className?: string;
  avatarNetworkProps?: AvatarNetworkProps;
  iconProps?: IconProps;
  label: string;
}

export { PickerNetworkProps };
