import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  useEnableMetametrics,
  useDisableMetametrics,
} from '../../../hooks/useMetametrics';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import { Text } from '../../component-library';
import ToggleButton from '../../ui/toggle-button';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getOptedIn, getUseExternalServices } from '../../../selectors';

const MetametricsToggle = ({
  dataCollectionForMarketing,
  setDataCollectionForMarketing,
  fromDefaultSettings = false,
}: {
  dataCollectionForMarketing: boolean;
  setDataCollectionForMarketing: (value: boolean) => Promise<void>;
  fromDefaultSettings?: boolean;
}) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { enableMetametrics, error: enableMetametricsError } =
    useEnableMetametrics();
  const { disableMetametrics, error: disableMetametricsError } =
    useDisableMetametrics();

  const error = enableMetametricsError || disableMetametricsError;

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isOptedIn = useSelector(getOptedIn);
  const useExternalServices = useSelector(getUseExternalServices);

  const handleUseParticipateInMetaMetrics = async (isParticipated: boolean) => {
    if (isParticipated) {
      await enableMetametrics();
      trackEvent(
        createEventBuilder(MetaMetricsEventName.TurnOnMetaMetrics)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            isProfileSyncingEnabled: isBackupAndSyncEnabled,
            participateInMetaMetrics: isOptedIn,
            location: fromDefaultSettings ? 'Default Settings' : 'Settings',
          })
          .build(),
      );
    } else {
      // disable data collection for marketing if participate in meta metrics is set to false
      if (dataCollectionForMarketing) {
        await setDataCollectionForMarketing(false);
      }

      trackEvent(
        createEventBuilder(MetaMetricsEventName.TurnOffMetaMetrics)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            isProfileSyncingEnabled: isBackupAndSyncEnabled,
            participateInMetaMetrics: isOptedIn,
          })
          .build(),
      );

      trackEvent(
        createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            [MetaMetricsUserTrait.IsMetricsOptedIn]: false,
            [MetaMetricsUserTrait.HasMarketingConsent]: false,
            location: 'Settings',
          })
          .build(),
      );

      await disableMetametrics();
    }
  };

  return (
    <Box>
      <Box
        className="flex settings-page__content-row"
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        gap={4}
        data-testid="participate-in-meta-metrics-container"
      >
        <div className="settings-page__content-item">
          <span>{t('participateInMetaMetrics')}</span>
          <div className="settings-page__content-description">
            {t('participateInMetaMetricsDescription')}
          </div>
        </div>

        <div
          className="settings-page__content-item-col"
          data-testid="participate-in-meta-metrics-toggle"
        >
          <ToggleButton
            value={isOptedIn}
            disabled={!useExternalServices}
            onToggle={(value) => handleUseParticipateInMetaMetrics(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
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
