import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendContext } from '../../../context/send';
import { useUnreliableNetworkRpc } from '../../../hooks/send/useUnreliableNetworkRpc';
import { SendAlertModal } from '../send-alert-modal';

type SendAlertsProps = {
  isSmartContractAlertOpen: boolean;
  onSmartContractClose: () => void;
  onSmartContractAcknowledge: () => void;
};

export const SendAlerts = ({
  isSmartContractAlertOpen,
  onSmartContractClose,
  onSmartContractAcknowledge,
}: SendAlertsProps) => {
  const t = useI18nContext();
  const { chainId } = useSendContext();
  const {
    isUnreliable: isNetworkUnreliable,
    networkName: unreliableNetworkName,
    navigateToEditNetwork,
  } = useUnreliableNetworkRpc();

  const [isNetworkAlertOpen, setIsNetworkAlertOpen] = useState(false);
  const lastAutoOpenedChainIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isNetworkUnreliable) {
      if (lastAutoOpenedChainIdRef.current !== chainId) {
        setIsNetworkAlertOpen(true);
        lastAutoOpenedChainIdRef.current = chainId;
      }
    } else {
      lastAutoOpenedChainIdRef.current = undefined;
      setIsNetworkAlertOpen(false);
    }
  }, [chainId, isNetworkUnreliable]);

  const handleNetworkClose = useCallback(() => {
    setIsNetworkAlertOpen(false);
  }, []);

  const handleNetworkAcknowledge = useCallback(() => {
    setIsNetworkAlertOpen(false);
    navigateToEditNetwork();
  }, [navigateToEditNetwork]);

  return (
    <>
      <SendAlertModal
        isOpen={isNetworkAlertOpen}
        title={t('unavailableNetworkConnection')}
        errorMessage={t('unavailableNetworkConnectionDescription', [
          unreliableNetworkName ?? '',
        ])}
        acknowledgeLabel={t('update')}
        onAcknowledge={handleNetworkAcknowledge}
        onClose={handleNetworkClose}
      />
      <SendAlertModal
        isOpen={isSmartContractAlertOpen}
        title={t('smartContractAddress')}
        errorMessage={t('smartContractAddressWarning')}
        onAcknowledge={onSmartContractAcknowledge}
        onClose={onSmartContractClose}
      />
    </>
  );
};
