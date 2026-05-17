import React from 'react';
import { GenericActivityCell } from './generic-activity-cell';
import type { ActivityCellProps } from './types';

export function ListItem({ data }: ActivityCellProps) {
  const description =
    data.type === 'contractInteraction'
      ? (data.data.transactionType ?? '')
      : undefined;

  return <GenericActivityCell data={data} description={description} />;
}
