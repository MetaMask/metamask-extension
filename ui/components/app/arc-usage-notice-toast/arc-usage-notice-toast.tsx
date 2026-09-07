import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import { Toast } from '../../multichain/toast';
import { selectShowArcUsageNoticeToast } from './selectors';

const ARC_CAIP_CHAIN_ID = 'eip155:5042';

export function ArcUsageNoticeToast() {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const shouldShow = useSelector(selectShowArcUsageNoticeToast);
  const [visible, setVisible] = useState(false);
  const [triggered, setTriggered] = useState(false);

  if (shouldShow && !triggered) {
    setTriggered(true);
    setVisible(true);
  }

  useEffect(() => {
    if (visible) {
      submitRequestToBackground('setArcUsageNoticeShown')?.catch((error) => {
        console.error('Error caught in submitRequestToBackground', error);
      });
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Toast
      dataTestId="arc-usage-notice-toast"
      startAdornment={
        <DsIcon name={DsIconName.Info} color={DsIconColor.IconDefault} />
      }
      text={t('arcUsageNoticeTitle')}
      description={t('arcUsageNoticeDescription')}
      onClose={() => {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.ArcUsageNoticeToastDismissed)
            .addCategory(MetaMetricsEventCategory.Home)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id_caip: ARC_CAIP_CHAIN_ID,
            })
            .build(),
        );
        setVisible(false);
      }}
    />
  );
}
