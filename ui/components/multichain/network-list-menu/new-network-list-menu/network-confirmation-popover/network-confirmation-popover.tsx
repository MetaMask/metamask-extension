import React, { useEffect, useState } from 'react';
import Popover from '../../../../ui/popover';
import ConfirmationPage from '../../../../../pages/confirmations/confirmation/confirmation';
import { ApprovalType } from '@metamask/controller-utils';
import { useSelector } from 'react-redux';
import { getUnapprovedConfirmations } from '../../../../../selectors';

const NetworkConfirmationPopover = () => {
  const [showPopover, setShowPopover] = useState(false);

  const unapprovedConfirmations = useSelector(getUnapprovedConfirmations);

  useEffect(() => {
    const anAddNetworkConfirmationFromMetaMaskExists =
      unapprovedConfirmations?.find(
        (confirmation) =>
          confirmation.origin === 'metamask' &&
          confirmation.type === ApprovalType.AddEthereumChain,
      );

    if (!showPopover && anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(true);
    } else if (showPopover && !anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(false);
    }
  }, [unapprovedConfirmations, showPopover]);

  return (
    <>
      {showPopover && (
        <Popover>
          <ConfirmationPage redirectToHomeOnZeroConfirmations={false} />
        </Popover>
      )}
    </>
  );
};

export default NetworkConfirmationPopover;
