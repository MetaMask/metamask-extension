import React, { useCallback, useMemo, useState } from 'react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendContext } from '../../../context/send';
import { useUnreliableNetworkRpc } from '../../../hooks/send/useUnreliableNetworkRpc';
import { SendAlertModal } from '../send-alert-modal';

type NetworkAlertDismissState = {
  networkStatusKey: string;
  userClosed: boolean;
};

export const SendAlerts = () => {
  const t = useI18nContext();
  const { chainId } = useSendContext();
  const {
    isUnreliable: isNetworkUnreliable,
    networkName: unreliableNetworkName,
    navigateToEditNetwork,
  } = useUnreliableNetworkRpc();

  const networkStatusKey = isNetworkUnreliable
    ? `${chainId}|open`
    : `${chainId}|closed`;
  const [dismissState, setDismissState] = useState<NetworkAlertDismissState>({
    networkStatusKey,
    userClosed: false,
  });

  if (dismissState.networkStatusKey !== networkStatusKey) {
    setDismissState({ networkStatusKey, userClosed: false });
  }

  const userClosed =
    dismissState.networkStatusKey === networkStatusKey
      ? dismissState.userClosed
      : false;
  const isNetworkAlertOpen = Boolean(isNetworkUnreliable && !userClosed);

  const handleNetworkClose = useCallback(() => {
    setDismissState({ networkStatusKey, userClosed: true });
  }, [networkStatusKey]);

  const handleNetworkAcknowledge = useCallback(() => {
    setDismissState({ networkStatusKey, userClosed: true });
    navigateToEditNetwork();
  }, [networkStatusKey, navigateToEditNetwork]);

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
