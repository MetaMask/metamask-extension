import { JSXElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const avatarIcon: UIComponentFactory<JSXElement> = ({ element }) => ({
  element: 'AvatarIcon',
  props: {
    ...element.props,
  },
});