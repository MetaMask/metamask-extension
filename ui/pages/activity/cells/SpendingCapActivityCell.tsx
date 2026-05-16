import React from 'react';
import { IconName } from '@metamask/design-system-react';
import { BaseActivityCell } from './BaseActivityCell';
import type { ActivityCellProps } from './types';

function getSpendingCapIcon(data: ActivityCellProps['data']) {
  if (data.type === 'revokeSpendingCap') {
    return IconName.RemoveMinus;
  }

  if (data.type === 'increaseSpendingCap') {
    return IconName.Add;
  }

  return IconName.Check;
}

export function SpendingCapActivityCell({ data }: ActivityCellProps) {
  return (
    <BaseActivityCell
      data={data}
      iconName={getSpendingCapIcon(data)}
      iconClassName="bg-muted text-primary-default"
    />
  );
}
