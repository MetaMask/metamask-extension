import { SkeletonElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const skeleton: UIComponentFactory<SkeletonElement> = ({ element }) => {
  return {
    element: 'SnapUISkeleton',
    props: {
      width: element.props.width,
      height: element.props.height,
      borderRadius: element.props.borderRadius,
    },
  };
};
