type NotificationImage = {
  src: string;
  width?: string;
  height?: string;
};

type UINotification = {
  id: number;
  date: string | null;
  image?: NotificationImage;
};

type UINotifications = {
  [key: number]: UINotification;
};

export type TranslationFunction = (key: string) => string;

export type ModalComponent<T> = {
  component: React.ComponentType<T>;
  props?: Partial<T>;
};

export type ModalHeaderProps = {
  onClose: () => void;
  image?: NotificationImage;
};
export type ModalBodyProps = { title: string };
export type ModalFooterProps = { onAction: () => void; onCancel: () => void };

export type TranslatedUINotification = {
  id: number;
  date: string | null;
  image?: NotificationImage;
  title: string;
  description: string[] | string;
  actionText?: string;
  modal?: {
    header?: ModalComponent<ModalHeaderProps>;
    body?: ModalComponent<ModalBodyProps>;
    footer?: ModalComponent<ModalFooterProps>;
  };
};

export type TranslatedUINotifications = {
  [key: number | string]: TranslatedUINotification;
};

export const NOTIFICATION_SOLANA_ON_METAMASK = 26;

export const UI_NOTIFICATIONS: UINotifications = {
  [NOTIFICATION_SOLANA_ON_METAMASK]: {
    id: Number(NOTIFICATION_SOLANA_ON_METAMASK),
    date: null,
  },
};
