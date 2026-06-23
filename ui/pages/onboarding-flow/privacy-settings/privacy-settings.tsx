import React, { useCallback, useContext, useEffect, useState } from 'react';
import classnames from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import {
  getBackupAndSyncOnboardingToggleState,
  getExternalServicesOnboardingToggleState,
} from '../../../selectors';
import { onboardingToggleBackupAndSyncOff } from '../../../ducks/app/app';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import BackupAndSyncTab from '../../settings/backup-and-sync-tab/backup-and-sync-tab';
import { PrivacySettingsLanding } from './privacy-settings-landing';
import { PrivacySettingsSubPageHeader } from './privacy-settings-sub-page-header';
import OnboardingPrivacySubPage from './onboarding-privacy-sub-page';
import PrivacySettingsNetworkRpc from './privacy-settings-network-rpc';
import {
  PRIVACY_SETTINGS_VIEW_TITLE_KEYS,
  type PrivacySettingsView,
} from './types';

const ANIMATION_TIME = 500;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PrivacySettings() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { search } = useLocation();
  const dispatch = useDispatch();
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

  const handleComplete = useCallback(() => {
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

  // Keep backup & sync intent in sync with basic functionality even when the
  // Backup & Sync sub-page (and its toggle) is not mounted.
  useEffect(() => {
    if (externalServicesOnboardingToggleState === false) {
      dispatch(onboardingToggleBackupAndSyncOff());
    }
  }, [externalServicesOnboardingToggleState, dispatch]);
  const [showDetail, setShowDetail] = useState(false);
  const [activeView, setActiveView] = useState<PrivacySettingsView | null>(
    null,
  );
  const [hiddenClass, setHiddenClass] = useState(true);

  const handleSelectView = (view: PrivacySettingsView) => {
    setActiveView(view);
    setShowDetail(true);

    setTimeout(() => {
      setHiddenClass(false);
    }, ANIMATION_TIME);
  };

  const handleBack = () => {
    setShowDetail(false);
    setTimeout(() => {
      setHiddenClass(true);
      setActiveView(null);
    }, ANIMATION_TIME);
  };

  return (
    <Box className="privacy-settings" data-testid="privacy-settings">
      <Box
        className={classnames('container', {
          'show-detail': showDetail,
          'show-list': !showDetail,
        })}
      >
        <Box className="list-view">
          <PrivacySettingsLanding
            onSelectView={handleSelectView}
            onComplete={handleComplete}
          />
        </Box>

        <Box
          className={classnames('detail-view', {
            hidden: !showDetail && hiddenClass,
          })}
        >
          {activeView ? (
            <>
              <PrivacySettingsSubPageHeader
                title={t(PRIVACY_SETTINGS_VIEW_TITLE_KEYS[activeView])}
                onBack={handleBack}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="flex-1 overflow-y-auto"
                data-testid="privacy-settings-settings"
              >
                {activeView === 'privacy' ? <OnboardingPrivacySubPage /> : null}
                {activeView === 'backup-and-sync' ? (
                  <BackupAndSyncTab isOnboarding />
                ) : null}
                {activeView === 'network-rpc' ? (
                  <PrivacySettingsNetworkRpc />
                ) : null}
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
