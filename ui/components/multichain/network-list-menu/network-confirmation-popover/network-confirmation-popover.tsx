import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';
import { ORIGIN_METAMASK } from '@metamask/approval-controller';
import Popover from '../../../ui/popover';
import ConfirmationPage from '../../../../pages/confirmations/confirmation/confirmation';
import { getUnapprovedConfirmations } from '../../../../selectors';

const NetworkConfirmationPopover = () => {
  const [showPopover, setShowPopover] = useState(false);

  const unapprovedConfirmations = useSelector(getUnapprovedConfirmations);

  useEffect(() => {
    const anAddNetworkConfirmationFromMetaMaskExists =
      unapprovedConfirmations?.find(
        (confirmation) =>
          confirmation.origin === ORIGIN_METAMASK &&
          confirmation.type === ApprovalType.AddEthereumChain,
      );

    if (!showPopover && anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(true);
    } else if (showPopover && !anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(false);
    }
  }, [unapprovedConfirmations, showPopover]);

  if (!showPopover) {
    return null;
  }

  return (
    <Popover data-testid="network-popover">
      <ConfirmationPage redirectToHomeOnZeroConfirmations={false} />
    </Popover>
  );
};

export default NetworkConfirmationPopover;
