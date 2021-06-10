// Messages and descriptions for these locale keys are in app/_locales/en/messages.json
export const UI_NOTIFICATIONS = {
  1: {
    id: 1,
    date: '2021-03-17',
    image: {
      src: 'images/mobile-link-qr.svg',
      height: '230px',
      width: '230px',
      placeImageBelowDescription: true,
    },
  },
  3: {
    id: 3,
    date: '2021-03-08',
  },
  4: {
    id: 4,
    date: '2021-05-11',
    image: {
      src: 'images/source-logos-bsc.svg',
      width: '100%',
    },
  },
  5: {
    id: 5,
    date: '2021-06-09',
  },
  6: {
    id: 6,
    date: '2021-05-26',
  },
};

export const getTranslatedUINoficiations = (t, locale) => {
  const formattedLocale = locale.replace('_', '-');
  return {
    1: {
      ...UI_NOTIFICATIONS[1],
      title: t('notifications1Title'),
      description: t('notifications1Description'),
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[1].date),
      ),
    },
    3: {
      ...UI_NOTIFICATIONS[3],
      title: t('notifications3Title'),
      description: t('notifications3Description'),
      actionText: t('notifications3ActionText'),
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[3].date),
      ),
    },
    4: {
      ...UI_NOTIFICATIONS[4],
      title: t('notifications4Title'),
      description: t('notifications4Description'),
      actionText: t('notifications4ActionText'),
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[4].date),
      ),
    },
    5: {
      ...UI_NOTIFICATIONS[5],
      title: t('walletSeed'),
      description: t('notifications5Description'),
      actionText: t('notifications3ActionText'),
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[5].date),
      ),
    },
    6: {
      ...UI_NOTIFICATIONS[6],
      title: t('notifications6Title'),
      description: [
        t('notifications6DescriptionOne'),
        t('notifications6DescriptionTwo'),
        t('notifications6DescriptionThree'),
      ],
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[6].date),
      ),
    },
  };
};
