import React from 'react';
import { IconName } from '@metamask/design-system-react';
import { BaseActivityCell } from './BaseActivityCell';
import type { ActivityCellProps } from './types';

export function TransferActivityCell({ data }: ActivityCellProps) {
  const isReceive = data.type === 'receive';

  return (
    <BaseActivityCell
      data={data}
      iconName={isReceive ? IconName.Receive : IconName.Send}
      iconClassName={
        isReceive
          ? 'bg-success-muted text-success-default'
          : 'bg-muted text-primary-default'
      }
    />
  );
}
