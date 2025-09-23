import React from 'react';
import { Skeleton } from '../../../components/component-library/skeleton';
import { AlignItems, BorderRadius} from '../../../helpers/constants/design-system';
import { Column, Row } from '../layout';

export const BridgeSkeletonLoader = () => {
  return (
    <Row gap={2} alignItems={AlignItems.center}>
      <Skeleton
        borderRadius={BorderRadius.full}
        height={32}
        width={32}
      />
      <Column gap={1} style={{ flex: 1 }}>
        <Skeleton
          height={24}
          width="100%"
        />
        <Skeleton
          height={22}
          width="100px"
        />
      </Column>
    </Row>
  );
}
