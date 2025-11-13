import type { INotification } from '@metamask/notification-services-controller/notification-services';

export type ExtractedNotification<NodeType> = Extract<
  INotification,
  { type: NodeType }
>;

export const isOfTypeNodeGuard =
  <NodeType extends INotification['type']>(types: NodeType[]) =>
  (n: INotification): n is ExtractedNotification<NodeType> =>
    types.includes(n.type as NodeType);
