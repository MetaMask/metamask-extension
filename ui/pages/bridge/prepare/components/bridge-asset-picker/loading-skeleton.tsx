import React from 'react';
import {
  Skeleton,
  SkeletonProps,
} from '../../../../../components/component-library/skeleton';
import {
  BlockSize,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { PolymorphicRef } from '../../../../../components/component-library';
import { Column, Row } from '../../../layout';

export const LoadingSkeleton = React.forwardRef(
  <Element extends React.ElementType = typeof Row>(
    props: SkeletonProps<Element>,
    ref?: PolymorphicRef<Element>,
  ) => {
    return (
      <Row
        ref={ref}
        gap={4}
        height={BlockSize.Max}
        width={BlockSize.Full}
        padding={4}
      >
        <Skeleton
          borderRadius={BorderRadius.full}
          height={32}
          width={32}
          {...props}
        />
        <Column gap={1}>
          <Skeleton height={16} width={60} {...props} />
          <Skeleton height={16} width={36} {...props} />
        </Column>
      </Row>
    );
  },
);
