import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Box } from '../../../../../components/component-library';
import { Toast } from '../../../../../components/multichain';
import {
  getLastInteractedConfirmationInfo,
  setLastInteractedConfirmationInfo,
} from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { selectNetworkConfigurationByChainId } from '../../../../../selectors';

const CHAIN_CHANGE_THRESHOLD_MILLISECONDS = 60 * 1000; // 1 Minute
const TOAST_TIMEOUT_MILLISECONDS = 5 * 1000; // 5 Seconds

const NetworkChangeToastLegacy = ({
  confirmation,
}: {
  confirmation: { id: string; chainId: string; origin: string };
}) => {
  const { chainId: newChainId, origin: newOrigin } = confirmation ?? {};
  const [toastMessage, setToastMessage] = useState<string[]>([]);
  const t = useI18nContext();

  const network = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, newChainId),
  );

  const hideToast = useCallback(() => {
    setToastMessage([]);
  }, [setToastMessage]);

  useEffect(() => {
    let isMounted = true;

    if (!confirmation?.id) {
      return undefined;
    }

    (async () => {
      const lastInteractedConfirmationInfo =
        await getLastInteractedConfirmationInfo();

      if (lastInteractedConfirmationInfo) {
        const currentTimestamp = new Date().getTime();

        const timeSinceLastConfirmation =
          currentTimestamp - lastInteractedConfirmationInfo.timestamp;

        const recentlyViewedOtherConfirmation =
          timeSinceLastConfirmation <= CHAIN_CHANGE_THRESHOLD_MILLISECONDS;

        if (recentlyViewedOtherConfirmation && isMounted) {
          const { chainId, origin } = lastInteractedConfirmationInfo;

          const messages: string[] = [];
          if (chainId !== newChainId) {
            messages.push(t('networkSwitchMessage', [network.name ?? '']));
          }

          if (origin !== newOrigin) {
            messages.push(t('originSwitchMessage', [new URL(newOrigin).host]));
          }

          if (messages.length) {
            setToastMessage(messages);
            setTimeout(() => {
              if (isMounted) {
                // hideToast();
              }
            }, TOAST_TIMEOUT_MILLISECONDS);
          }
        }
      }

      const isNewId =
        !lastInteractedConfirmationInfo ||
        lastInteractedConfirmationInfo?.id !== confirmation.id;

      if (isNewId && isMounted) {
        setLastInteractedConfirmationInfo({
          id: confirmation.id,
          chainId: newChainId,
          origin: newOrigin,
          timestamp: new Date().getTime(),
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    confirmation?.id,
    hideToast,
    network.name,
    newChainId,
    newOrigin,
    setToastMessage,
    t,
  ]);

  if (!toastMessage?.length) {
    return null;
  }

  return (
    <Box className="toast_wrapper">
      <Toast onClose={hideToast} text={toastMessage} startAdornment={null} />
    </Box>
  );
};

export default NetworkChangeToastLegacy;
