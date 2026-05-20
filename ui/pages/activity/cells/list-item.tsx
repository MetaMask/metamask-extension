import React from 'react';
import { GenericActivityCell } from './generic-activity-cell';
import type { ActivityCellProps } from './types';

export function ListItem({ data, onClick }: ActivityCellProps) {
  return <GenericActivityCell data={data} onClick={onClick} />;
}
