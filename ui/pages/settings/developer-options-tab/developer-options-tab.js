///: BEGIN:ONLY_INCLUDE_IF(developer-options)
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
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
} from '../../../store/actions';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';

const DeveloperOptionsTab = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const [hasResetAnnouncements, setHasResetAnnouncements] = useState(false);
  const [hasResetOnboarding, setHasResetOnboarding] = useState(false);

  const settingsRefs = Array(
    getNumberOfSettingRoutesInTab(t, t('developerOptions')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  const handleResetAnnouncementClick = useCallback(() => {
    resetViewedNotifications();
    setHasResetAnnouncements(true);
  }, []);

  const handleResetOnboardingClick = useCallback(async () => {
    await dispatch(resetOnboarding());
    setHasResetOnboarding(true);

    const backUpSRPRoute = `${ONBOARDING_SECURE_YOUR_WALLET_ROUTE}/?isFromReminder=true`;
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

    if (isPopup) {
      global.platform.openExtensionInBrowser(backUpSRPRoute);
    } else {
      history.push(backUpSRPRoute);
    }
  }, [dispatch, history]);

  useEffect(() => {
    handleSettingsRefs(t, t('developerOptions'), settingsRefs);
  }, [t, settingsRefs]);

  return (
    <div className="settings-page__body">
      <Text className="settings-page__security-tab-sub-header__bold">
        {t('states')}
      </Text>
      <Text
        className="settings-page__security-tab-sub-header"
        color={TextColor.textAlternative}
        paddingTop={6}
        ref={settingsRefs[0]}
      >
        {t('resetStates')}
      </Text>

      <div className="settings-page__content-padded">
        <Box
          ref={settingsRefs[1]}
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

        <Box
          ref={settingsRefs[2]}
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
      </div>
    </div>
  );
};

export default DeveloperOptionsTab;
///: END:ONLY_INCLUDE_IF
