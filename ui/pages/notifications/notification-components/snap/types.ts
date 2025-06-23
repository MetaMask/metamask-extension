import {
  TRIGGER_TYPES,
  type ExpandedView,
} from '@metamask/notification-services-controller/notification-services';
import { ExtractedNotification } from '../node-guard';

export type SnapNotification = ExtractedNotification<TRIGGER_TYPES.SNAP>;

export type DetailedViewData = Extract<
  SnapNotification['data'],
  { origin: string; message: string; detailedView: ExpandedView }
>;
