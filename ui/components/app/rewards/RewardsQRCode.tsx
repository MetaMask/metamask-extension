import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setRewardsModalOpen,
  setRewardsDeepLinkUrl,
} from '../../../ducks/rewards';
import { selectRewardsDeepLinkUrl } from '../../../ducks/rewards/selectors';
import { DeepLinkQRCode } from '../deep-link-qr-code';
import { useDispatch } from '../../../store/hooks';
import { REWARDS_DEEP_LINK_BASE_URL } from './utils/constants';

export default function RewardsQRCode() {
  const rewardsDeepLinkUrl = useSelector(selectRewardsDeepLinkUrl);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    dispatch(setRewardsModalOpen(false));
    dispatch(setRewardsDeepLinkUrl(null));
  }, [dispatch]);

  const dataToEncode = rewardsDeepLinkUrl ?? REWARDS_DEEP_LINK_BASE_URL;

  return (
    <DeepLinkQRCode
      title={t('rewardsQRCodeTitle')}
      description={t('rewardsQRCodeDescription')}
      data={dataToEncode}
      onDone={handleClose}
      doneLabel={t('done')}
      testId="rewards-onboarding-qrcode-container"
    />
  );
}
