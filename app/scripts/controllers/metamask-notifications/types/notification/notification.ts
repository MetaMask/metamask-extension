import type { Notification } from '../types';

export type { Notification } from '../types';

// NFT
export type NFT = {
  token_id: string;
  image: string;
  collection?: {
    name: string;
    image: string;
  };
};

export type MarkAsReadNotificationsParam = Pick<
  Notification,
  'id' | 'type' | 'isRead'
>[];
