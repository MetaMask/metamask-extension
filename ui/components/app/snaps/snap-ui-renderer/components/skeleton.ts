import { SkeletonElement } from '@metamask/snaps-sdk/jsx';
import { BorderRadius } from '../../../../../helpers/constants/design-system';
import { mapSnapBorderRadiusToExtensionBorderRadius } from '../utils';
import { UIComponentFactory } from './types';

const DEFAULT_SKELETON_WIDTH = 96;
const DEFAULT_SKELETON_HEIGHT = 22;
const DEFAULT_SKELETON_BORDER_RADIUS = BorderRadius.MD;

export const skeleton: UIComponentFactory<SkeletonElement> = ({ element }) => {
  return {
    element: 'Skeleton',
    props: {
      width: element.props.width ?? DEFAULT_SKELETON_WIDTH,
      height: element.props.height ?? DEFAULT_SKELETON_HEIGHT,
      borderRadius: element.props.borderRadius
        ? mapSnapBorderRadiusToExtensionBorderRadius(element.props.borderRadius)
        : DEFAULT_SKELETON_BORDER_RADIUS,
    },
  };
};
