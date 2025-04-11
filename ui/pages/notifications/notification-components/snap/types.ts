import type { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { type ExpandedView } from '@metamask/notification-services-controller/notification-services';

import type { ExtractedNotification } from '../node-guard';

export type SnapNotification = ExtractedNotification<TRIGGER_TYPES.SNAP>;

export type DetailedViewData = Extract<
  SnapNotification['data'],
  { origin: string; message: string; detailedView: ExpandedView }
>;
