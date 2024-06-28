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
import ToggleButton from '../../../components/ui/toggle-button';
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
  setRedesignedConfirmationsEnabledFeature,
} from '../../../store/actions';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getIsRedesignedConfirmationsFeatureEnabled } from '../../../selectors/selectors';

const DeveloperOptionsTab = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const redesignConfirmationsFeatureToggle = useSelector(getIsRedesignedConfirmationsFeatureEnabled);

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

  const handleToggleEnableConfirmationsRedesign = async (
    value: boolean,
  ): Promise<void> => {
    await dispatch(setRedesignedConfirmationsEnabledFeature(value));
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
          <span>{t('announcements')}</span>
          <div className="settings-page__content-description">
            {t('developerOptionsResetStatesAnnouncementsDescription')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button
            variant={ButtonVariant.Primary}
            onClick={handleResetAnnouncementClick}
          >
            {t('reset')}
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
          <span>{t('onboarding')}</span>
          <div className="settings-page__content-description">
            {t('developerOptionsResetStatesOnboarding')}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button
            variant={ButtonVariant.Primary}
            onClick={handleResetOnboardingClick}
          >
            {t('reset')}
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
      <Box
        ref={settingsRefs[3] as React.RefObject<HTMLDivElement>}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <div className="settings-page__content-description">
            <span>{t('serviceWorkerKeepAlive')}</span>
            <div className="settings-page__content-description">
              {t('developerOptionsServiceWorkerKeepAlive')}
            </div>
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={isServiceWorkerKeptAlive}
            onToggle={(value) => handleToggleServiceWorkerAlive(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="developer-options-service-worker-alive-toggle"
          />
        </div>
      </Box>
    );
  };

  const renderNetworkMenuRedesign = () => {
    return (
      <Box
        ref={settingsRefs[4] as React.RefObject<HTMLDivElement>}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <div className="settings-page__content-description">
            <span>{t('developerOptionsNetworkMenuRedesignTitle')}</span>
            <div className="settings-page__content-description">
              {t('developerOptionsNetworkMenuRedesignDescription')}
            </div>
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={enableNetworkRedesign}
            onToggle={(value) => {
              setEnableNetworkRedesign(!value);
              // eslint-disable-next-line
              /* @ts-expect-error: Avoids error from window property not existing */
              window.metamaskFeatureFlags.networkMenuRedesign = !value;
            }}
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="developer-options-network-redesign"
          />
        </div>
      </Box>
    );
  };

  const renderEnableConfirmationsRedesignToggle = () => {
    return (
      <Box
        ref={settingsRefs[3] as React.RefObject<HTMLDivElement>}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <div className="settings-page__content-description">
            <span>{t('developerOptionsEnableConfirmationsRedesignTitle')}</span>
            <div className="settings-page__content-description">
              {t('developerOptionsEnableConfirmationsRedesignDescription')}
            </div>
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={isRedesignedConfirmationsFeatureEnabled}
            onToggle={(value) =>
              handleToggleEnableConfirmationsRedesign(!value)
            }
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="developer-options-enable-confirmations-redesign-toggle"
          />
        </div>
      </Box>
    );
  };

  return (
    <div className="settings-page__body">
      <Text className="settings-page__security-tab-sub-header__bold">
        {t('states')}
      </Text>
      <Text
        className="settings-page__security-tab-sub-header"
        color={TextColor.textAlternative}
        paddingTop={6}
        ref={settingsRefs[0] as React.RefObject<HTMLDivElement>}
      >
        {t('resetStates')}
      </Text>

      <div className="settings-page__content-padded">
        {renderAnnouncementReset()}
        {renderOnboardingReset()}
        {renderServiceWorkerKeepAliveToggle()}
        {renderNetworkMenuRedesign()}
        {renderEnableConfirmationsRedesignToggle()}
      </div>
    </div>
  );
};

export default DeveloperOptionsTab;
