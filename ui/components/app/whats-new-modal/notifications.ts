import {
  TranslationFunction,
  TranslatedUINotifications,
  UI_NOTIFICATIONS,
  NOTIFICATION_SOLANA_ON_METAMASK,
} from '../../../../shared/notifications';
import {
  SolanaModalHeader,
  SolanaModalBody,
  SolanaModalFooter,
} from './solana';

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
