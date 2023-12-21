import React, { useEffect } from 'react';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';

import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import {
  TextColor,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import { useI18nContext } from '../../../hooks/useI18nContext';

const DeveloperOptionsTab = () => {
  const t = useI18nContext();

  const settingsRefs = Array(
    getNumberOfSettingsInSection(t, t('developerOptions')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

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
              onClick={() => {
                console.log('todo: update state');
              }}
            >
              {t('reset')}
            </Button>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default DeveloperOptionsTab;
