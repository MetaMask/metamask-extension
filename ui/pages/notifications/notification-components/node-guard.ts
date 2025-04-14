import { type Notification } from './types/notifications/notifications';

export type ExtractedNotification<NodeType> = Extract<
  Notification,
  { type: NodeType }
>;

export const isOfTypeNodeGuard =
  <NodeType extends Notification['type']>(types: NodeType[]) =>
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  (n: Notification): n is ExtractedNotification<NodeType> =>
    types.includes(n.type as NodeType);
