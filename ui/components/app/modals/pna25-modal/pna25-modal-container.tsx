import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectCanShowLowPriorityModal,
  getHomeDeepLinkQrCode,
} from '../../../../selectors/home-modals';
import { selectShowPna25Modal } from '../../toast-master/selectors';
import { selectRewardsModalOpen } from '../../../../ducks/rewards/selectors';
import Pna25Modal from './pna25-modal';

/**
 * Self-contained container for the PNA-25 modal.
 * Reads all priority guard selectors from Redux so that Home no longer needs
 * to receive or track PNA25-related props.
 *
 * Priority order: deeplink QR > rewards (modal open) > PNA25.
 */
export function Pna25ModalContainer() {
  const canShow = useSelector(selectCanShowLowPriorityModal);
  const showPna25Modal = useSelector(selectShowPna25Modal);
  const rewardsModalOpen = useSelector(selectRewardsModalOpen);
  const deepLinkQrCode = useSelector(getHomeDeepLinkQrCode);

  if (!showPna25Modal || !canShow || rewardsModalOpen || deepLinkQrCode) {
    return null;
  }

  return <Pna25Modal />;
}
