import { JSXElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const avatarIcon: UIComponentFactory<JSXElement> = ({ element }) => ({
  element: 'AvatarIcon',
  props: {
    // Define props once we expose this component to snap developers
    ...element.props,
  },
});
