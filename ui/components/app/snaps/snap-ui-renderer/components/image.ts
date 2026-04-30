import { ImageElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

function generateBorderRadius(
  borderRadius?: ImageElement['props']['borderRadius'],
) {
  switch (borderRadius) {
    default:
    case 'none':
      return '0';

    case 'medium':
      return '6px';

    case 'full':
      return '50%';
  }
}

export const image: UIComponentFactory<ImageElement> = ({ element }) => ({
  element: 'SnapUIImage',
  props: {
    value: element.props.src,
    borderRadius: generateBorderRadius(element.props.borderRadius),
    height: element.props.height,
    width: element.props.width,
  },
});
