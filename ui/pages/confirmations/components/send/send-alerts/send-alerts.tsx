import React, { useCallback, useMemo, useState } from 'react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendContext } from '../../../context/send';
import { useUnreliableNetworkRpc } from '../../../hooks/send/useUnreliableNetworkRpc';
import { SendAlertModal } from '../send-alert-modal';

export const SendAlerts = () => {
  const t = useI18nContext();
  const { chainId } = useSendContext();
  const {
    isUnreliable: isNetworkUnreliable,
    networkName: unreliableNetworkName,
    navigateToEditNetwork,
  } = useUnreliableNetworkRpc();

  const [isNetworkAlertOpen, setIsNetworkAlertOpen] = useState(false);
  const [lastAutoOpenedChainId, setLastAutoOpenedChainId] = useState<
    string | undefined
  >();

  if (isNetworkUnreliable) {
    if (lastAutoOpenedChainId !== chainId) {
      setLastAutoOpenedChainId(chainId);
      setIsNetworkAlertOpen(true);
    }
  } else if (lastAutoOpenedChainId !== undefined || isNetworkAlertOpen) {
    setLastAutoOpenedChainId(undefined);
    setIsNetworkAlertOpen(false);
  }

  const handleNetworkClose = useCallback(() => {
    setIsNetworkAlertOpen(false);
  }, []);

  const handleNetworkAcknowledge = useCallback(() => {
    setIsNetworkAlertOpen(false);
    navigateToEditNetwork();
  }, [navigateToEditNetwork]);

  const networkAlerts = useMemo(
    () => [
      {
        key: 'networkUnreliable',
        title: t('unavailableNetworkConnection'),
        message: t('unavailableNetworkConnectionDescription', [
          unreliableNetworkName ?? '',
        ]),
        acknowledgeButtonLabel: t('update'),
      },
    ],
    [t, unreliableNetworkName],
  );

  return (
    <SendAlertModal
      isOpen={isNetworkAlertOpen}
      alerts={networkAlerts}
      onAcknowledge={handleNetworkAcknowledge}
      onClose={handleNetworkClose}
    />
  );
};
