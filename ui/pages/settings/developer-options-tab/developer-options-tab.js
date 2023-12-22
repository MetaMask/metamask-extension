import React, { useCallback, useEffect, useState } from 'react';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

import { resetViewedNotifications } from '../../../store/actions';

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

import { useI18nContext } from '../../../hooks/useI18nContext';

const DeveloperOptionsTab = () => {
  const t = useI18nContext();
  const [hasResetAnnouncements, setHasResetAnnouncements] = useState(false);

  const settingsRefs = Array(
    getNumberOfSettingsInSection(t, t('developerOptions')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  const handleResetAnnouncementClick = useCallback(() => {
    resetViewedNotifications();
    setHasResetAnnouncements(true);
  }, []);

  useEffect(() => {
    handleSettingsRefs(t, t('experimental'), settingsRefs);
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
      </div>
    </div>
  );
};

export default DeveloperOptionsTab;
