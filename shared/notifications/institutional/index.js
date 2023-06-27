export const UI_INSTITUTIONAL_NOTIFICATIONS = {
  1: {
    id: 11,
    date: '2022-08-28',
    image: {
      src: 'images/portfolio.svg',
    },
    hideDate: true,
    descriptionInBullets: true,
  },
};

export const getTranslatedInstitutionalUINotifications = (t, locale) => {
  const formattedLocale = locale.replace('_', '-');
  return {
    1: {
      ...UI_INSTITUTIONAL_NOTIFICATIONS[11],
      title: 'Portfolio dashboard',
      description: [
        'Portfolio snapshots',
        'Filtering by account and network',
        'Sector and protocol allocation',
        'Improved navigation',
      ],
      date: new Intl.DateTimeFormat(formattedLocale).format(
        new Date(UI_INSTITUTIONAL_NOTIFICATIONS[11].date),
      ),
      customButton: {
        name: 'mmi-portfolio',
        text: t('viewPortfolioDashboard'),
        logo: true,
      },
    },
  };
};
