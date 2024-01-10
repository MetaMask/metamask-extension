import { Image } from '@metamask/snaps-sdk';
import { UiComponent } from './types';

export const image: UiComponent<Image> = ({ element }) => ({
  element: 'SnapUIImage',
  props: {
    value: element.value,
  },
});
