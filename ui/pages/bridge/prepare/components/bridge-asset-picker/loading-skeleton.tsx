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
    props: React.ComponentProps<typeof Row> & {
      skeletonProps: SkeletonProps<Element>;
    },
    ref?: PolymorphicRef<Element>,
  ) => {
    const { skeletonProps, ...rest } = props;
    return (
      <Row ref={ref} gap={4} width={BlockSize.Full} padding={4} {...rest}>
        <Skeleton
          borderRadius={BorderRadius.full}
          height={32}
          width={32}
          {...skeletonProps}
          style={{ ...skeletonProps?.style, flexShrink: 0 }}
        />
        <Column gap={1}>
          <Skeleton height={16} width={60} {...skeletonProps} />
          <Skeleton height={16} width={36} {...skeletonProps} />
        </Column>
      </Row>
    );
  },
);
