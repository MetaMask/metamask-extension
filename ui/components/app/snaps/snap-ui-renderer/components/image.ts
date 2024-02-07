import { Image } from '@metamask/snaps-sdk';
import { UIComponent } from './types';

export const image: UIComponent<Image> = ({ element }) => ({
  element: 'SnapUIImage',
  props: {
    value: element.value,
  },
});
