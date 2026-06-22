import { useCallback, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import {
  getBackupAndSyncOnboardingToggleState,
  getExternalServicesOnboardingToggleState,
} from '../../../selectors';

export const useOnboardingPrivacyCompletion = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { trackEvent } = useContext(MetaMetricsContext);
  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );
  const isOnboardingBackupAndSyncEnabled = useSelector(
    getBackupAndSyncOnboardingToggleState,
  );
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');

  return useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_group: 'onboarding_advanced_configuration',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_profile_syncing_enabled:
          isOnboardingBackupAndSyncEnabled || isBackupAndSyncEnabled,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_basic_functionality_enabled: externalServicesOnboardingToggleState,
      },
    });

    if (isFromReminder) {
      navigate(`${ONBOARDING_COMPLETION_ROUTE}?isFromReminder=true`, {
        replace: true,
      });
      return;
    }

    navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
  }, [
    externalServicesOnboardingToggleState,
    isBackupAndSyncEnabled,
    isFromReminder,
    isOnboardingBackupAndSyncEnabled,
    navigate,
    trackEvent,
  ]);
};
