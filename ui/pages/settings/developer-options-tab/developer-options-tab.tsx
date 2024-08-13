import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import {
  IconColor,
  TextColor,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_SECURE_YOUR_WALLET_ROUTE } from '../../../helpers/constants/routes';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  resetOnboarding,
  resetViewedNotifications,
  setServiceWorkerKeepAlivePreference,
  setRedesignedConfirmationsDeveloperEnabled,
} from '../../../store/actions';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getIsRedesignedConfirmationsDeveloperEnabled } from '../../confirmations/selectors/confirm';
import ToggleRow from './developer-options-toggle-row-component';
import { SentryTest } from './sentry-test';

/**
 * Settings Page for Developer Options (internal-only)
 *
 * This page does not need i18n translation support because it's an internal settings page.
 * We only support the t('developerOptions') translation because the general settings architecture
 * utilizes the translation key to render.
 *
 * @returns
 */
const DeveloperOptionsTab = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const redesignConfirmationsFeatureToggle = useSelector(
    getIsRedesignedConfirmationsDeveloperEnabled,
  );

  const [hasResetAnnouncements, setHasResetAnnouncements] = useState(false);
  const [hasResetOnboarding, setHasResetOnboarding] = useState(false);
  const [isServiceWorkerKeptAlive, setIsServiceWorkerKeptAlive] =
    useState(true);
  const [
    isRedesignedConfirmationsFeatureEnabled,
    setIsRedesignedConfirmationsFeatureEnabled,
  ] = useState(redesignConfirmationsFeatureToggle);
  const [enableNetworkRedesign, setEnableNetworkRedesign] = useState(
    // eslint-disable-next-line
    /* @ts-expect-error: Avoids error from window property not existing */
    window.metamaskFeatureFlags.networkMenuRedesign,
  );

  const settingsRefs = Array(
    getNumberOfSettingRoutesInTab(t, t('developerOptions')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  useEffect(() => {
    handleSettingsRefs(t, t('developerOptions'), settingsRefs);
  }, [t, settingsRefs]);

  const handleResetAnnouncementClick = useCallback((): void => {
    resetViewedNotifications();
    setHasResetAnnouncements(true);
  }, []);

  const handleResetOnboardingClick = useCallback(async (): Promise<void> => {
    await dispatch(resetOnboarding());
    setHasResetOnboarding(true);

    const backUpSRPRoute = `${ONBOARDING_SECURE_YOUR_WALLET_ROUTE}/?isFromReminder=true`;
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

    if (isPopup) {
      const { platform } = global;
      if (platform?.openExtensionInBrowser) {
        platform?.openExtensionInBrowser(backUpSRPRoute, null, true);
      }
    } else {
      history.push(backUpSRPRoute);
    }
  }, [dispatch, history]);

  const handleToggleServiceWorkerAlive = async (
    value: boolean,
  ): Promise<void> => {
    await dispatch(setServiceWorkerKeepAlivePreference(value));
    setIsServiceWorkerKeptAlive(value);
  };

  const setEnableConfirmationsRedesignEnabled = async (
    value: boolean,
  ): Promise<void> => {
    await dispatch(setRedesignedConfirmationsDeveloperEnabled(value));
    await setIsRedesignedConfirmationsFeatureEnabled(value);
  };

  const renderAnnouncementReset = () => {
    return (
      <Box
        ref={settingsRefs[1] as React.RefObject<HTMLDivElement>}
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
            are the notifications shown in the What's New popup modal.
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
        ref={settingsRefs[2] as React.RefObject<HTMLDivElement>}
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
            "Secure Your Wallet" onboarding page.
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button
            variant={ButtonVariant.Primary}
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
        onToggle={(value) => handleToggleServiceWorkerAlive(!value)}
        dataTestId="developer-options-service-worker-alive-toggle"
        settingsRef={settingsRefs[3] as React.RefObject<HTMLDivElement>}
      />
    );
  };

  const renderNetworkMenuRedesign = () => {
    return (
      <ToggleRow
        title="Network Menu Redesign"
        description="Toggles the new design of the Networks menu"
        isEnabled={enableNetworkRedesign}
        onToggle={(value) => {
          setEnableNetworkRedesign(!value);
          // eslint-disable-next-line
          /* @ts-expect-error: Avoids error from window property not existing */
          window.metamaskFeatureFlags.networkMenuRedesign = !value;
        }}
        dataTestId="developer-options-network-redesign"
        settingsRef={settingsRefs[4] as React.RefObject<HTMLDivElement>}
      />
    );
  };

  const renderEnableConfirmationsRedesignToggle = () => {
    return (
      <ToggleRow
        title="Confirmations Redesign"
        description="Enables or disables the confirmations redesign feature currently in development"
        isEnabled={isRedesignedConfirmationsFeatureEnabled}
        onToggle={(value: boolean) =>
          setEnableConfirmationsRedesignEnabled(!value)
        }
        dataTestId="developer-options-enable-confirmations-redesign-toggle"
        settingsRef={settingsRefs[5] as React.RefObject<HTMLDivElement>}
      />
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
        ref={settingsRefs[0] as React.RefObject<HTMLDivElement>}
      >
        Reset States
      </Text>

      <div className="settings-page__content-padded">
        {renderAnnouncementReset()}
        {renderOnboardingReset()}
        {renderServiceWorkerKeepAliveToggle()}
        {renderNetworkMenuRedesign()}
        {renderEnableConfirmationsRedesignToggle()}
      </div>
      <SentryTest />
    </div>
  );
};

export default DeveloperOptionsTab;
