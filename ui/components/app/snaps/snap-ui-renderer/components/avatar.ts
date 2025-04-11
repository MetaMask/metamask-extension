import type { AvatarElement } from '@metamask/snaps-sdk/jsx';

import type { UIComponentFactory } from './types';

export const avatar: UIComponentFactory<AvatarElement> = ({ element }) => ({
  element: 'SnapUIAvatar',
  props: {
    address: element.props.address,
    size: element.props.size,
  },
});
