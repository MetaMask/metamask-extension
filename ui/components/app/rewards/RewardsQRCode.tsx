import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setRewardsModalOpen,
  setOnboardingReferralCode,
  setRewardsDeeplinkUrl,
} from '../../../ducks/rewards';
import { selectRewardsDeeplinkUrl } from '../../../ducks/rewards/selectors';
import { DeeplinkQRCode } from '../deeplink-qr-code';
import { REWARDS_DEEPLINK_BASE_URL } from './utils/constants';

export default function RewardsQRCode() {
  const rewardsDeeplinkUrl = useSelector(selectRewardsDeeplinkUrl);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    dispatch(setRewardsModalOpen(false));
    dispatch(setOnboardingReferralCode(null));
    dispatch(setRewardsDeeplinkUrl(null));
  }, [dispatch]);

  const dataToEncode = rewardsDeeplinkUrl ?? REWARDS_DEEPLINK_BASE_URL;

  return (
    <DeeplinkQRCode
      title={t('rewardsQRCodeTitle')}
      description={t('rewardsQRCodeDescription')}
      data={dataToEncode}
      onDone={handleClose}
      doneLabel={t('done')}
      testId="rewards-onboarding-qrcode-container"
    />
  );
}
