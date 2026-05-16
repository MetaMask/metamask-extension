import type { ComponentType } from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';

export type ActivityCellProps = {
  data: ActivityListItem;
};

export type ActivityCellComponent = ComponentType<ActivityCellProps>;
