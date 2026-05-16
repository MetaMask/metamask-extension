import React from 'react';
import { BaseActivityCell } from './BaseActivityCell';
import { ContractInteractionActivityCell } from './ContractInteractionActivityCell';
import type { ActivityCellProps } from './types';

export function ListItem({ data }: ActivityCellProps) {
  if (data.type === 'contractInteraction') {
    return <ContractInteractionActivityCell data={data} />;
  }

  return <BaseActivityCell data={data} />;
}
