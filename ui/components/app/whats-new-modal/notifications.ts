import type {
  TranslationFunction,
  TranslatedUINotifications,
} from '../../../../shared/notifications';
import {
  UI_NOTIFICATIONS,
  NOTIFICATION_SOLANA_ON_METAMASK,
} from '../../../../shared/notifications';
import {
  SolanaModalHeader,
  SolanaModalBody,
  SolanaModalFooter,
} from './solana';

export const getTranslatedUINotifications = (
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
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
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
