import React, { FunctionComponent } from 'react';
import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';
import { mapSnapBorderRadiusToExtensionBorderRadius } from '../snap-ui-renderer/utils';

export type SnapUISkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: BorderRadius;
};

export const SnapUISkeleton: FunctionComponent<SnapUISkeletonProps> = ({
  width,
  height,
  borderRadius,
}) => {
  return (
    <Skeleton
      width={width || '100%'}
      height={height || 16}
      borderRadius={mapSnapBorderRadiusToExtensionBorderRadius(borderRadius)}
    />
  );
};
