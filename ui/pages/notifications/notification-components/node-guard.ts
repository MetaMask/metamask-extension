import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { SnapNotification } from '../snap/types/types';

type Notification =
  | NotificationServicesController.Types.INotification
  | SnapNotification;

export type ExtractedNotification<NodeType> = Extract<
  Notification,
  { type: NodeType }
>;

export const isOfTypeNodeGuard =
  <NodeType extends Notification['type']>(types: NodeType[]) =>
  (n: Notification): n is ExtractedNotification<NodeType> =>
    types.includes(n.type as NodeType);
