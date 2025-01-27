import { SkeletonElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

const DEFAULT_SKELETON_WIDTH = '100%';
const DEFAULT_SKELETON_HEIGHT = 22;

export const skeleton: UIComponentFactory<SkeletonElement> = ({ element }) => {
  return {
    element: 'SnapUISkeleton',
    props: {
      width: element.props.width || DEFAULT_SKELETON_WIDTH,
      height: element.props.height || DEFAULT_SKELETON_HEIGHT,
      borderRadius: element.props.borderRadius,
    },
  };
};
