import { useSelector } from 'react-redux';
import { selectSessionData } from '../../../selectors/identity/authentication';

export function useNotificationAnalyticsProperties() {
  const sessionData = useSelector(selectSessionData);
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  return { profile_id: sessionData?.profile.profileId };
}
