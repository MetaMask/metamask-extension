import React from 'react';
import { IconName } from '@metamask/design-system-react';
import { BaseActivityCell } from './BaseActivityCell';
import type { ActivityCellProps } from './types';

export function ContractInteractionActivityCell({ data }: ActivityCellProps) {
  const description =
    data.type === 'contractInteraction'
      ? (data.data.transactionType ?? '')
      : '';

  return (
    <BaseActivityCell
      data={data}
      description={description}
      iconName={IconName.ProgrammingArrows}
      iconClassName="bg-muted text-primary-default"
    />
  );
}
