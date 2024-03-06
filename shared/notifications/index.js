// Messages and descriptions for these locale keys are in app/_locales/en/messages.json

/**
 * I'm trying something new here, where notifications get names that are translated
 * into numbers in only one place. This should make merge conflicts easier.
 */
export const NOTIFICATION_DROP_LEDGER_FIREFOX = 25;
export const NOTIFICATION_OPEN_BETA_SNAPS = 26;
export const NOTIFICATION_BUY_SELL_BUTTON = 27;
export const NOTIFICATION_U2F_LEDGER_LIVE = 28;
export const NOTIFICATION_BLOCKAID_DEFAULT = 29;
export const NOTIFICATION_STAKING_PORTFOLIO = 30;
export const NOTIFICATION_PETNAMES = 31;

export const UI_NOTIFICATIONS = {
  8: {
    id: 8,
    date: '2021-11-01',
  },
  20: {
    id: 20,
    date: null,
  },
  24: {
    id: 24,
    date: null,
  },
  // This syntax is unusual, but very helpful here.  It's equivalent to `UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX] =`
  [NOTIFICATION_DROP_LEDGER_FIREFOX]: {
    id: Number(NOTIFICATION_DROP_LEDGER_FIREFOX),
    date: null,
  },
  [NOTIFICATION_OPEN_BETA_SNAPS]: {
    id: Number(NOTIFICATION_OPEN_BETA_SNAPS),
    date: null,
    image: {
      src: 'images/introducing-snaps.svg',
      width: '100%',
    },
  },
  [NOTIFICATION_BUY_SELL_BUTTON]: {
    id: Number(NOTIFICATION_BUY_SELL_BUTTON),
    date: null,
    image: {
      src: 'images/sell_button_whatsnew.png',
      width: '100%',
    },
  },
  [NOTIFICATION_U2F_LEDGER_LIVE]: {
    id: Number(NOTIFICATION_U2F_LEDGER_LIVE),
    date: null,
  },
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  [NOTIFICATION_BLOCKAID_DEFAULT]: {
    id: Number(NOTIFICATION_BLOCKAID_DEFAULT),
    date: null,
  },
  ///: END:ONLY_INCLUDE_IF
  [NOTIFICATION_STAKING_PORTFOLIO]: {
    id: Number(NOTIFICATION_STAKING_PORTFOLIO),
    date: null,
    image: {
      src: 'images/staking-light-mode-preview.png',
      width: '100%',
    },
  },
  [NOTIFICATION_PETNAMES]: {
    id: Number(NOTIFICATION_PETNAMES),
    date: null,
    image: {
      src: 'images/petnames-whatsnew-banner.svg',
      width: '100%',
    },
  },
};

export const getTranslatedUINotifications = (
  t,
  locale,
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  theme,
  ///: END:ONLY_INCLUDE_IF
) => {
  const formattedLocale = locale?.replace('_', '-');

  return {
    8: {
      ...UI_NOTIFICATIONS[8],
      title: t('notifications8Title'),
      description: [
        t('notifications8DescriptionOne'),
        t('notifications8DescriptionTwo'),
      ],
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[8].date),
      ),
      actionText: t('notifications8ActionText'),
    },
    20: {
      ...UI_NOTIFICATIONS[20],
      title: t('notifications20Title'),
      description: [t('notifications20Description')],
      actionText: t('notifications20ActionText'),
      date: UI_NOTIFICATIONS[20].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[20].date),
          )
        : '',
    },
    24: {
      ...UI_NOTIFICATIONS[24],
      title: t('notifications24Title'),
      description: t('notifications24Description'),
      actionText: t('notifications24ActionText'),
      date: UI_NOTIFICATIONS[24].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[24].date),
          )
        : '',
    },
    // This syntax is unusual, but very helpful here.  It's equivalent to `unnamedObject[NOTIFICATION_DROP_LEDGER_FIREFOX] =`
    [NOTIFICATION_DROP_LEDGER_FIREFOX]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX],
      title: t('notificationsDropLedgerFirefoxTitle'),
      description: [t('notificationsDropLedgerFirefoxDescription')],
      date: UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX].date),
          )
        : '',
    },
    [NOTIFICATION_OPEN_BETA_SNAPS]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_OPEN_BETA_SNAPS],
      title: t('notificationsOpenBetaSnapsTitle'),
      description: [
        t('notificationsOpenBetaSnapsDescriptionOne'),
        t('notificationsOpenBetaSnapsDescriptionTwo'),
        t('notificationsOpenBetaSnapsDescriptionThree'),
      ],
      actionText: t('notificationsOpenBetaSnapsActionText'),
      date: UI_NOTIFICATIONS[NOTIFICATION_OPEN_BETA_SNAPS].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[NOTIFICATION_OPEN_BETA_SNAPS].date),
          )
        : '',
    },
    [NOTIFICATION_BUY_SELL_BUTTON]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_BUY_SELL_BUTTON],
      title: t('notificationsBuySellTitle'),
      description: t('notificationsBuySellDescription'),
      actionText: t('notificationsBuySellActionText'),
      date: UI_NOTIFICATIONS[NOTIFICATION_BUY_SELL_BUTTON].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[NOTIFICATION_BUY_SELL_BUTTON].date),
          )
        : '',
    },
    [NOTIFICATION_U2F_LEDGER_LIVE]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_U2F_LEDGER_LIVE],
      title: t('notificationsU2FLedgerLiveTitle'),
      description: [t('notificationsU2FLedgerLiveDescription')],
      date: UI_NOTIFICATIONS[NOTIFICATION_U2F_LEDGER_LIVE].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[NOTIFICATION_U2F_LEDGER_LIVE].date),
          )
        : '',
    },
    [NOTIFICATION_STAKING_PORTFOLIO]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_STAKING_PORTFOLIO],
      title: t('notificationsStakingPortfolioTitle'),
      description: [t('notificationsStakingPortfolioDescription')],
      actionText: t('notificationsStakingPortfolioActionText'),
      date: UI_NOTIFICATIONS[NOTIFICATION_STAKING_PORTFOLIO].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[NOTIFICATION_STAKING_PORTFOLIO].date),
          )
        : '',
    },
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    [NOTIFICATION_BLOCKAID_DEFAULT]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_BLOCKAID_DEFAULT],
      title: t('notificationsBlockaidDefaultTitle'),
      description: [
        t('notificationsBlockaidDefaultDescriptionOne'),
        t('notificationsBlockaidDefaultDescriptionTwo'),
      ],
      actionText: t('notificationsBlockaidDefaultDescriptionActionText'),
      date: UI_NOTIFICATIONS[NOTIFICATION_BLOCKAID_DEFAULT].date
        ? new Intl.DateTimeFormat(formattedLocale).format(
            new Date(UI_NOTIFICATIONS[NOTIFICATION_BLOCKAID_DEFAULT].date),
          )
        : '',
      image:
        theme === 'dark'
          ? {
              src: 'images/blockaid-whats-new-theme-dark.svg',
              width: '100%',
            }
          : {
              src: 'images/blockaid-whats-new.svg',
              width: '100%',
            },
    },
    ///: END:ONLY_INCLUDE_IF
    [NOTIFICATION_PETNAMES]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_PETNAMES],
      title: t('notificationsPetnamesTitle'),
      description: [
        t('notificationsPetnamesDescriptionOne'),
        t('notificationsPetnamesDescriptionTwo'),
      ],
      actionText: t('notificationsPetnamesActionText'),
      date: '',
    },
  };
};
