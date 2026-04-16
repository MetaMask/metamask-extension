import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';
import { ORIGIN_METAMASK } from '@metamask/approval-controller';
import Popover from '../../../ui/popover';
import ConfirmationPage from '../../../../pages/confirmations/confirmation/confirmation';
import { getUnapprovedConfirmations } from '../../../../selectors';
import { useBoolean } from '../../../../hooks/useBoolean';

const NetworkConfirmationPopover = () => {
  const {
    value: isOpen,
    setTrue: openPopover,
    setFalse: closePopover,
  } = useBoolean();

  const unapprovedConfirmations = useSelector(getUnapprovedConfirmations);

  useEffect(() => {
    const anAddNetworkConfirmationFromMetaMaskExists =
      unapprovedConfirmations?.find(
        (confirmation) =>
          confirmation.origin === ORIGIN_METAMASK &&
          confirmation.type === ApprovalType.AddEthereumChain,
      );

    if (!isOpen && anAddNetworkConfirmationFromMetaMaskExists) {
      openPopover();
    } else if (isOpen && !anAddNetworkConfirmationFromMetaMaskExists) {
      closePopover();
    }
  }, [closePopover, openPopover, isOpen, unapprovedConfirmations]);

  if (!isOpen) {
    return null;
  }

  return (
    <Popover data-testid="network-popover">
      <ConfirmationPage redirectToHomeOnZeroConfirmations={false} />
    </Popover>
  );
};

export default NetworkConfirmationPopover;
