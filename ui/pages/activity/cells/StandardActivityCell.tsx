import React from 'react';
import { IconName } from '@metamask/design-system-react';
import { BaseActivityCell } from './BaseActivityCell';
import type { ActivityCellProps } from './types';

export function StandardActivityCell({ data }: ActivityCellProps) {
  return (
    <BaseActivityCell
      data={data}
      iconName={IconName.Coin}
      iconClassName="bg-muted text-primary-default"
    />
  );
}
