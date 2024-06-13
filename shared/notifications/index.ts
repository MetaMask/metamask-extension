// Messages and descriptions for these locale keys are in app/_locales/en/messages.json

/**
 * I'm trying something new here, where notifications get names that are translated
 * into numbers in only one place. This should make merge conflicts easier.
 */
export const NOTIFICATION_DROP_LEDGER_FIREFOX = 25;

type NotificationImage = {
  src: string;
  width: string;
};

type UINotification = {
  id: number;
  date: string | null;
  image?: NotificationImage;
};

// Assuming all keys in UI_NOTIFICATIONS are of the same structure
type UINotifications = {
  [key: number]: UINotification;
};

export const UI_NOTIFICATIONS: UINotifications = {
  // This syntax is unusual, but very helpful here.  It's equivalent to `UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX] =`
  [NOTIFICATION_DROP_LEDGER_FIREFOX]: {
    id: Number(NOTIFICATION_DROP_LEDGER_FIREFOX),
    date: null,
  },
};

type TranslationFunction = (key: string) => string;

type TranslatedUINotification = {
  id: number;
  date: string | null;
  image?: NotificationImage;
  title: string;
  description: string[] | string;
  actionText?: string;
};

type TranslatedUINotifications = {
  [key: number | string]: TranslatedUINotification;
};

const formatDate = (
  date: string | null,
  formattedLocale: string | undefined,
): string => {
  let parsedDate: Date;
  if (date) {
    const dateParts = date.split('-');
    parsedDate = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2]),
    );
  } else {
    parsedDate = new Date();
  }

  return new Intl.DateTimeFormat(formattedLocale).format(parsedDate);
};

export const getTranslatedUINotifications = (
  t: TranslationFunction,
  locale: string,
): TranslatedUINotifications => {
  // Added return type here
  const formattedLocale = locale?.replace('_', '-');

  return {
    // This syntax is unusual, but very helpful here.  It's equivalent to `unnamedObject[NOTIFICATION_DROP_LEDGER_FIREFOX] =`
    [NOTIFICATION_DROP_LEDGER_FIREFOX]: {
      ...UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX],
      title: t('notificationsDropLedgerFirefoxTitle'),
      description: [t('notificationsDropLedgerFirefoxDescription')],
      date: UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX].date
        ? formatDate(
            UI_NOTIFICATIONS[NOTIFICATION_DROP_LEDGER_FIREFOX].date,
            formattedLocale,
          )
        : '',
    },
  };
};
