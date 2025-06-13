import {
  NOTIFICATION_SOLANA_ON_METAMASK,
  TranslatedUINotifications,
  TranslationFunction,
  UI_NOTIFICATIONS,
} from '../../../../shared/notifications';
import {
  SolanaModalBody,
  SolanaModalFooter,
  SolanaModalHeader,
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
        height: '60px',
      },
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
