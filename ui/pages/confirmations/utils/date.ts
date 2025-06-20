import { DateTime } from 'luxon';

export const formatDate = (dateString: string) => {
  if (!dateString) {
    return dateString;
  }

  return DateTime.fromISO(dateString)
    .setLocale('en')
    .setZone('utc')
    .toFormat('dd LLLL yyyy, HH:mm');
};
