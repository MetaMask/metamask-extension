import type { Notification } from '../../../../app/scripts/controllers/metamask-notifications/types/notification/notification';

export type ExtractedNotification<NodeType> = Extract<
  Notification,
  { type: NodeType }
>;

export const isOfTypeNodeGuard =
  <NodeType extends Notification['type']>(types: NodeType[]) =>
  (n: Notification): n is ExtractedNotification<NodeType> =>
    types.includes(n.type as NodeType);
