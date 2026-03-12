import React from 'react';
import { Skeleton } from '../../../components/component-library/skeleton';
import { JustifyContent } from '../../../helpers/constants/design-system';
import { Column, Row } from '../layout';

const QUOTE_CARD_SKELETON_ROWS = [
  { labelWidth: 92, valueWidth: 132 },
  { labelWidth: 80, valueWidth: 64 },
  { labelWidth: 88, valueWidth: 56 },
  { labelWidth: 108, valueWidth: 120 },
] as const;

export const MultichainBridgeQuoteCardSkeleton = () => (
  <Column gap={4} data-testid="multichain-bridge-quote-card-loading">
    {QUOTE_CARD_SKELETON_ROWS.map(({ labelWidth, valueWidth }) => (
      <Row
        key={`${labelWidth}-${valueWidth}`}
        justifyContent={JustifyContent.spaceBetween}
        data-testid="multichain-bridge-quote-card-loading-row"
      >
        <Skeleton width={labelWidth} height={16} />
        <Skeleton width={valueWidth} height={16} />
      </Row>
    ))}
  </Column>
);
