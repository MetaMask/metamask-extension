import React, { useState } from 'react';
import classnames from 'clsx';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PrivacySettingsLanding } from './privacy-settings-landing';
import { PrivacySettingsSubPageHeader } from './privacy-settings-sub-page-header';
import OnboardingPrivacySubPage from './onboarding-privacy-sub-page';
import OnboardingBackupSyncSubPage from './onboarding-backup-sync-sub-page';
import PrivacySettingsNetworkRpc from './privacy-settings-network-rpc';
import { useOnboardingPrivacyCompletion } from './use-onboarding-privacy-completion';
import {
  PRIVACY_SETTINGS_VIEW_TITLE_KEYS,
  type PrivacySettingsView,
} from './privacy-settings.types';

const ANIMATION_TIME = 500;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PrivacySettings() {
  const t = useI18nContext();
  const handleComplete = useOnboardingPrivacyCompletion();
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
                  <OnboardingBackupSyncSubPage />
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
