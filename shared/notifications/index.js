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
  7: {
    id: 7,
    date: '2021-09-17',
  },
  8: {
    id: 8,
    date: '2021-11-01',
  },
  9: {
    id: 9,
    date: '2021-12-07',
    image: {
      src: 'images/txinsights.png',
      width: '80%',
    },
  },
  10: {
    id: 10,
    date: '2022-04-18',
    image: {
      src: 'images/token-detection.svg',
      width: '100%',
    },
  },
  11: {
    id: 11,
    date: '2022-04-18',
  },
  12: {
    id: 12,
    date: '2022-05-18',
    image: {
      src: 'images/darkmode-banner.png',
      width: '100%',
    },
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
      title: t('secretRecoveryPhrase'),
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
    7: {
      ...UI_NOTIFICATIONS[7],
      title: t('notifications7Title'),
      description: [
        t('notifications7DescriptionOne'),
        t('notifications7DescriptionTwo'),
      ],
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[7].date),
      ),
    },
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
    9: {
      ...UI_NOTIFICATIONS[9],
      title: t('notifications9Title'),
      description: [
        t('notifications9DescriptionOne'),
        t('notifications9DescriptionTwo'),
      ],
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[9].date),
      ),
    },
    10: {
      ...UI_NOTIFICATIONS[10],
      title: t('notifications10Title'),
      description: [
        t('notifications10DescriptionOne'),
        t('notifications10DescriptionTwo'),
        t('notifications10DescriptionThree'),
      ],
      actionText: t('notifications10ActionText'),
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[10].date),
      ),
    },
    11: {
      ...UI_NOTIFICATIONS[11],
      title: t('notifications11Title'),
      description: t('notifications11Description'),
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[11].date),
      ),
    },
    12: {
      ...UI_NOTIFICATIONS[12],
      title: t('notifications12Title'),
      description: t('notifications12Description'),
      actionText: t('notifications12ActionText'),
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_NOTIFICATIONS[12].date),
      ),
    },
  };
};
