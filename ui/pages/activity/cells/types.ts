import type { ActivityListItem } from '../../../../shared/lib/activity/types';

export type ActivityCellProps = {
  data: ActivityListItem;
  onClick?: () => void;
};
