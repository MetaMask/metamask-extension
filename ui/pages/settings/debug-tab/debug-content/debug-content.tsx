import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import {
  IconColor,
  TextColor,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../../helpers/constants/routes';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  perpsToggleTestnet,
  resetOnboarding,
  resetViewedNotifications,
  setServiceWorkerKeepAlivePreference,
} from '../../../../store/actions';
import { selectPerpsIsTestnet } from '../../../../selectors/perps-controller';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../shared/constants/app';
import { getRemoteFeatureFlags } from '../../../../../shared/lib/selectors/remote-feature-flags';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { ConfirmationsDeveloperOptions } from '../../../confirmations/components/developer/confirmations-developer-options';
import ToggleRow from './toggle-row-component';
import SentryTest from './sentry-test';
import { BackupAndSyncDevSettings } from './backup-and-sync';
import MigrateToSplitStateTest from './migrate-to-split-state-test';

const DebugContent = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // This translation call is only required for the "Generate Page Crash" test button.
  // The crash mechanism works by setting 'debug' to undefined in the locale,
  // which causes this t() call to throw an error that triggers the error boundary.
  t('debug');

  const [hasResetAnnouncements, setHasResetAnnouncements] = useState(false);
  const [hasResetOnboarding, setHasResetOnboarding] = useState(false);
  const [isServiceWorkerKeptAlive, setIsServiceWorkerKeptAlive] =
    useState(true);

  const handleResetAnnouncementClick = useCallback((): void => {
    resetViewedNotifications();
    setHasResetAnnouncements(true);
  }, []);

  const handleResetOnboardingClick = useCallback(async (): Promise<void> => {
    await dispatch(resetOnboarding());
    setHasResetOnboarding(true);

    const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

    if (isPopup) {
      const { platform } = global;
      if (platform?.openExtensionInBrowser) {
        platform?.openExtensionInBrowser(backUpSRPRoute, null, true);
      }
    } else {
      navigate(backUpSRPRoute);
    }
  }, [dispatch, navigate]);

  const handleToggleServiceWorkerAlive = async (
    value: boolean,
  ): Promise<void> => {
    await dispatch(setServiceWorkerKeepAlivePreference(value));
    setIsServiceWorkerKeptAlive(value);
  };

  const renderAnnouncementReset = () => {
    return (
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>Announcements</span>
          <div className="settings-page__content-description">
            Resets isShown boolean to false for all announcements. Announcements
            are the notifications shown in the What&apos;s New popup modal.
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button
            variant={ButtonVariant.Primary}
            onClick={handleResetAnnouncementClick}
          >
            Reset
          </Button>
        </div>
        <div className="settings-page__content-item-col">
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            paddingLeft={2}
            paddingRight={2}
            style={{ height: '40px', width: '40px' }}
          >
            <Icon
              className="settings-page-developer-options__icon-check"
              name={IconName.Check}
              color={IconColor.successDefault}
              size={IconSize.Lg}
              hidden={!hasResetAnnouncements}
            />
          </Box>
        </div>
      </Box>
    );
  };

  const renderOnboardingReset = () => {
    return (
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div
          className="settings-page__content-item"
          style={{ flex: '1 1 auto' }}
        >
          <span>Onboarding</span>
          <div className="settings-page__content-description">
            Resets various states related to onboarding and redirects to the
            &quot;Secure Your Wallet&quot; onboarding page.
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button
            variant={ButtonVariant.Primary}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={handleResetOnboardingClick}
          >
            Reset
          </Button>
        </div>
        <div className="settings-page__content-item-col">
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            paddingLeft={2}
            paddingRight={2}
            style={{ height: '40px', width: '40px' }}
          >
            <Icon
              className="settings-page-developer-options__icon-check"
              name={IconName.Check}
              color={IconColor.successDefault}
              size={IconSize.Lg}
              hidden={!hasResetOnboarding}
            />
          </Box>
        </div>
      </Box>
    );
  };

  const renderServiceWorkerKeepAliveToggle = () => {
    return (
      <ToggleRow
        title="Service Worker Keep Alive"
        description="Results in a timestamp being continuously saved to session.storage"
        isEnabled={isServiceWorkerKeptAlive}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onToggle={(value) => handleToggleServiceWorkerAlive(!value)}
        dataTestId="developer-options-service-worker-alive-toggle"
      />
    );
  };

  const isPerpsTestnet = useSelector(selectPerpsIsTestnet);
  const perpsTestnetToggleRef = useRef<HTMLDivElement>(null);

  const handleTogglePerpsTestnet = useCallback(async (): Promise<void> => {
    await perpsToggleTestnet();
  }, []);

  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);

  const renderRemoteFeatureFlags = () => {
    return (
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>Remote feature flags</span>
          <div className="settings-page__content-description">
            Remote feature flag values come from LaunchDarkly by default. If you
            need to update feature flag values locally for development purposes,
            you can change feature flag values in .manifest-overrides.json,
            which will override values coming from LaunchDarkly.
          </div>
        </div>
        <details className="remote-feature-flags-details">
          <summary data-testid="remote-feature-flags-toggle">
            View feature flags JSON
          </summary>
          <pre
            className="remote-feature-flags-json"
            data-testid="developer-options-remote-feature-flags"
          >
            <code>{JSON.stringify(remoteFeatureFlags, null, 2)}</code>
          </pre>
        </details>
      </Box>
    );
  };

  return (
    <div className="settings-page__body">
      <Text className="settings-page__security-tab-sub-header__bold">
        States
      </Text>

      <Text
        className="settings-page__security-tab-sub-header"
        color={TextColor.textAlternative}
        paddingTop={6}
      >
        Current States
      </Text>
      <div className="settings-page__content-padded">
        {renderRemoteFeatureFlags()}
      </div>
      <Text
        className="settings-page__security-tab-sub-header"
        color={TextColor.textAlternative}
        paddingTop={6}
      >
        Reset States
      </Text>
      <div className="settings-page__content-padded">
        {renderAnnouncementReset()}
        {renderOnboardingReset()}
        {renderServiceWorkerKeepAliveToggle()}
        {process.env.METAMASK_DEBUG && (
          <ToggleRow
            title="Perps Testnet"
            description="Toggle perps controller between mainnet and testnet markets."
            isEnabled={isPerpsTestnet}
            onToggle={handleTogglePerpsTestnet}
            dataTestId="perps-testnet-toggle"
            settingsRef={perpsTestnetToggleRef}
          />
        )}
      </div>

      <BackupAndSyncDevSettings />
      <SentryTest />
      <hr />
      <MigrateToSplitStateTest />
      <hr />
      <ConfirmationsDeveloperOptions />
    </div>
  );
};

export default DebugContent;
