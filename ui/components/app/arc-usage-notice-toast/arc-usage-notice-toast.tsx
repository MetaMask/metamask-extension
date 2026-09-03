import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
} from '@metamask/design-system-react';
import { BorderRadius } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import { Toast } from '../../multichain/toast';
import { selectShowArcUsageNoticeToast } from './selectors';

export function ArcUsageNoticeToast() {
  const t = useI18nContext();
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
      borderRadius={BorderRadius.LG}
      onClose={() => setVisible(false)}
    />
  );
}
