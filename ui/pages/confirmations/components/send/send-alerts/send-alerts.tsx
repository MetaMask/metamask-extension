import React, { useCallback, useMemo, useState } from 'react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendContext } from '../../../context/send';
import { useUnreliableNetworkRpc } from '../../../hooks/send/useUnreliableNetworkRpc';
import { SendAlertModal } from '../send-alert-modal';

type NetworkAlertUiState = {
  epochKey: string;
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

  // Keyed by chain + reliability. Persist epoch resets into state so a later
  // unreliable flap (same chain) does not reuse a stale userClosed=true.
  const epochKey = isNetworkUnreliable
    ? `${chainId}|open`
    : `${chainId}|closed`;
  const [uiState, setUiState] = useState<NetworkAlertUiState>({
    epochKey,
    userClosed: false,
  });

  if (uiState.epochKey !== epochKey) {
    setUiState({ epochKey, userClosed: false });
  }

  const userClosed =
    uiState.epochKey === epochKey ? uiState.userClosed : false;
  const isNetworkAlertOpen = Boolean(isNetworkUnreliable && !userClosed);

  const handleNetworkClose = useCallback(() => {
    setUiState({ epochKey, userClosed: true });
  }, [epochKey]);

  const handleNetworkAcknowledge = useCallback(() => {
    setUiState({ epochKey, userClosed: true });
    navigateToEditNetwork();
  }, [epochKey, navigateToEditNetwork]);

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
