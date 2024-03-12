import { Image } from '@metamask/snaps-sdk';
import { UIComponentFactory } from './types';

export const image: UIComponentFactory<Image> = ({ element }) => ({
  element: 'SnapUIImage',
  props: {
    value: element.value,
  },
});
