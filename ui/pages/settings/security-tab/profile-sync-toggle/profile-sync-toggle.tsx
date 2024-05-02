import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useEnableProfileSyncing } from '../../../../hooks/metamask-notifications/useProfileSyncing';
import { selectIsProfileSyncingEnabled } from '../../../../selectors/metamask-notifications/profile-syncing';
import { selectParticipateInMetaMetrics } from '../../../../selectors/metamask-notifications/authentication';
import { showConfirmTurnOffProfileSyncing } from '../../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { Box } from '../../../../components/component-library';
import ToggleButton from '../../../../components/ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';

const ProfileSyncToggle = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const { enableProfileSyncing } = useEnableProfileSyncing();
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const participateInMetaMetrics = useSelector(selectParticipateInMetaMetrics);

  const handleUseProfileSync = async () => {
    if (isProfileSyncingEnabled) {
      dispatch(showConfirmTurnOffProfileSyncing());
    } else {
      await enableProfileSyncing();
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.TurnOnProfileSyncing,
        properties: {
          isProfileSyncingEnabled,
          participateInMetaMetrics,
        },
      });
    }
  };

  return (
    <Box
      className="settings-page__content-row"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      gap={4}
      data-testid="profileSyncToggle"
    >
      <div className="settings-page__content-item" id="profileSyncLabel">
        <span>{t('profileSync')}</span>
        <div
          className="settings-page__content-description"
          data-testid="profileSyncDescription"
        >
          {t('profileSyncDescription', [
            <a
              href="https://consensys.io/privacy-policy/"
              key="link"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="privacyPolicyLink"
            >
              {t('profileSyncPrivacyLink')}
            </a>,
          ])}
        </div>
      </div>

      <div className="settings-page__content-item-col">
        <ToggleButton
          value={isProfileSyncingEnabled}
          onToggle={handleUseProfileSync}
          offLabel={t('off')}
          onLabel={t('on')}
          dataTestId="toggleButton"
        />
      </div>
    </Box>
  );
};

export default ProfileSyncToggle;
