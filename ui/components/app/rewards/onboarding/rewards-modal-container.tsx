import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectCanShowLowPriorityModal,
  getHomeDeepLinkQrCode,
} from '../../../../selectors/home-modals';
import { selectRewardsEnabled } from '../../../../ducks/rewards/selectors';
import RewardsModal from './RewardsModal';

/**
 * Self-contained container for the Rewards onboarding modal.
 * Reads all priority guard selectors from Redux so that Home no longer needs
 * to receive or track rewards-related props.
 *
 * Priority order: deeplink QR > rewards > PNA25.
 * The `!deepLinkQrCode` guard prevents rewards from appearing while the
 * deeplink QR code modal is displayed.
 */
export function RewardsModalContainer() {
  const canShow = useSelector(selectCanShowLowPriorityModal);
  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const deepLinkQrCode = useSelector(getHomeDeepLinkQrCode);

  if (!rewardsEnabled || !canShow || deepLinkQrCode) {
    return null;
  }

  return <RewardsModal />;
}
