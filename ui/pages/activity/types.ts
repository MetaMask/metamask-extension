import type { ActivityListItem } from '../../../shared/lib/activity/types';

export type ActivityRowProps = {
  data: ActivityListItem;
  onClick?: () => void;
};
