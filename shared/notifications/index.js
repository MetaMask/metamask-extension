const notificationDates = {
  1: new Date(2021, 2, 17),
  2: new Date(2020, 7, 31),
  3: new Date(2021, 2, 8),
};

// Messages and descriptions for these locale keys are in app/_locales/en/messages.json
export const UI_NOTIFICATIONS = {
  1: {
    id: 1,
    date: notificationDates[1].toString(),
    image: {
      src: 'images/mobile-link-qr.svg',
      height: '270px',
      width: '270px',
    },
  },
  2: {
    id: 2,
    date: notificationDates[2].toString(),
  },
  3: {
    id: 3,
    date: notificationDates[3].toString(),
  },
};

export const getTranslatedUINoficiations = (t, locale) => {
  return {
    1: {
      ...UI_NOTIFICATIONS[1],
      title: t('notifications1Title'),
      description: t('notifications1Description'),
      date: new Intl.DateTimeFormat(locale).format(notificationDates[1]),
    },
    2: {
      ...UI_NOTIFICATIONS[2],
      title: t('notifications2Title'),
      description: t('notifications2Description'),
      actionText: t('notifications2ActionText'),
      date: new Intl.DateTimeFormat(locale).format(notificationDates[2]),
    },
    3: {
      ...UI_NOTIFICATIONS[3],
      title: t('notifications3Title'),
      description: t('notifications3Description'),
      actionText: t('notifications3ActionText'),
      date: new Intl.DateTimeFormat(locale).format(notificationDates[3]),
    },
  };
};
