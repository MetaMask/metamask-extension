import type { ActivityListItem } from '../../selectors/activity/types';

export type LocalActivityListItem = ActivityListItem & {
  isEarliestNonce?: boolean;
};

export type ActivityRowProps = {
  data: LocalActivityListItem;
  onClick?: () => void;
};
