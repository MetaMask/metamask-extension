import { ImageElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const image: UIComponentFactory<ImageElement> = ({ element }) => ({
  element: 'SnapUIImage',
  props: {
    value: element.props.src,
  },
});
