// Messages and descriptions for these locale keys are in app/_locales/en/messages.json
export const UI_NOTIFICATIONS = {
  1: {
    id: 1,
    title: 'notificationsTitle1',
    description: 'notificationsDescription1',
    date: '2020-03-17',
    image: 'images/swaps-logos-small.svg',
    actionText: 'notificationsActionText1',
  },
  2: {
    id: 2,
    title: 'notificationsTitle2',
    description: 'notificationsDescription2',
    date: '2020-03-17',
    actionText: 'notificationsActionText2',
  },
  3: {
    id: 3,
    title: 'notificationsTitle3',
    description: 'notificationsDescription3',
    date: '2020-03-17',
    actionText: 'notificationsActionText3',
  },
};

export const getTranslatedUINoficiations = (t) => {
  return {
    1: {
      ...UI_NOTIFICATIONS[1],
      title: t('notificationsTitle1'),
      description: t('notificationsDescription1'),
      actionText: t('notificationsActionText1'),
    },
    2: {
      ...UI_NOTIFICATIONS[2],
      title: t('notificationsTitle2'),
      description: t('notificationsDescription2'),
      actionText: t('notificationsActionText2'),
    },
    3: {
      ...UI_NOTIFICATIONS[3],
      title: t('notificationsTitle3'),
      description: t('notificationsDescription3'),
      actionText: t('notificationsActionText3'),
    },
  };
};
