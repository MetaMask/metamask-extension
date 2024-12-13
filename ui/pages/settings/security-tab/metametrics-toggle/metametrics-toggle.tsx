import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  useEnableMetametrics,
  useDisableMetametrics,
} from '../../../../hooks/identity/useMetametrics';
import { selectIsProfileSyncingEnabled } from '../../../../selectors/identity/profile-syncing';
import { selectParticipateInMetaMetrics } from '../../../../selectors/identity/authentication';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { Box, Text } from '../../../../components/component-library';
import ToggleButton from '../../../../components/ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

const MetametricsToggle = ({
  dataCollectionForMarketing,
  setDataCollectionForMarketing,
}: {
  dataCollectionForMarketing: boolean;
  setDataCollectionForMarketing: (value: boolean) => void;
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { enableMetametrics, error: enableMetametricsError } =
    useEnableMetametrics();
  const { disableMetametrics, error: disableMetametricsError } =
    useDisableMetametrics();

  const error = enableMetametricsError || disableMetametricsError;

  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const participateInMetaMetrics = useSelector(selectParticipateInMetaMetrics);

  const handleUseParticipateInMetaMetrics = async () => {
    if (participateInMetaMetrics) {
      await disableMetametrics();
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.TurnOffMetaMetrics,
        properties: {
          isProfileSyncingEnabled,
          participateInMetaMetrics,
        },
      });

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          is_metrics_opted_in: false,
          has_marketing_consent: false,
          location: 'Settings',
        },
      });
    } else {
      await enableMetametrics();
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.TurnOnMetaMetrics,
        properties: {
          isProfileSyncingEnabled,
          participateInMetaMetrics,
        },
      });
    }

    if (dataCollectionForMarketing) {
      setDataCollectionForMarketing(false);
    }
  };

  return (
    <Box>
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        data-testid="profileSyncToggle"
      >
        <div className="settings-page__content-item" id="profileSyncLabel">
          <span>{t('participateInMetaMetrics')}</span>
          <div
            className="settings-page__content-description"
            data-testid="profileSyncDescription"
          >
            {t('participateInMetaMetricsDescription')}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="participateInMetaMetrics"
        >
          <ToggleButton
            value={participateInMetaMetrics}
            onToggle={handleUseParticipateInMetaMetrics}
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="toggleButton"
          />
        </div>
      </Box>
      {error && (
        <Box paddingBottom={4}>
          <Text
            as="p"
            color={TextColor.errorDefault}
            variant={TextVariant.bodySm}
          >
            {t('notificationsSettingsBoxError')}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default MetametricsToggle;
