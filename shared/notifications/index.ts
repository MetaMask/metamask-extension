import {
  SolanaModalHeader,
  SolanaModalBody,
  SolanaModalFooter,
} from '../../ui/components/app/whats-new-modal/solana';

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

type TranslationFunction = (key: string) => string;

type ModalComponent = {
  component: React.ComponentType<any>;
  props?: Record<string, any>;
};

type TranslatedUINotification = {
  id: number;
  date: string | null;
  image?: NotificationImage;
  title: string;
  description: string[] | string;
  actionText?: string;
  modal?: {
    header?: ModalComponent;
    body?: ModalComponent;
    footer?: ModalComponent;
  };
};

type TranslatedUINotifications = {
  [key: number | string]: TranslatedUINotification;
};

export const NOTIFICATION_SOLANA_ON_METAMASK = 25;

export const UI_NOTIFICATIONS: UINotifications = {
  [NOTIFICATION_SOLANA_ON_METAMASK]: {
    id: Number(NOTIFICATION_SOLANA_ON_METAMASK),
    date: null,
  },
};

export const getTranslatedUINotifications = (
  t: TranslationFunction,
): TranslatedUINotifications => {
  return {
    [NOTIFICATION_SOLANA_ON_METAMASK]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_SOLANA_ON_METAMASK],
      title: t('solanaOnMetaMask'),
      description: '',
      image: {
        src: 'images/solana-logo-transparent.svg',
        width: 'auto',
        height: '70px',
      },
      date: UI_NOTIFICATIONS[NOTIFICATION_SOLANA_ON_METAMASK].date || '',
      modal: {
        header: {
          component: SolanaModalHeader,
        },
        body: {
          component: SolanaModalBody,
        },
        footer: {
          component: SolanaModalFooter,
        },
      },
    },
  };
};
