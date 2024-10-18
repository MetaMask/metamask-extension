import { AvatarElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const avatar: UIComponentFactory<AvatarElement> = ({ element }) => ({
  element: 'SnapUIAvatar',
  props: {
    address: element.props.address,
  },
});
