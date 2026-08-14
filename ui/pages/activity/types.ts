import type { ActivityListItem } from '../../../shared/lib/activity/types';

export type LocalActivityListItem = ActivityListItem & {
  isEarliestNonce?: boolean;
};

export type ActivityRowProps = {
  data: LocalActivityListItem;
  onClick?: () => void;
};
