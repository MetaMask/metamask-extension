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
  const newChainId = confirmation?.chainId;
  const newOrigin = confirmation?.origin;
  const [chainChanged, setChainChanged] = useState(false);
  const [originChanged, setOriginChanged] = useState(false);
  const t = useI18nContext();

  const network = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, newChainId),
  );

  const hideToast = useCallback(() => {
    setChainChanged(false);
    setOriginChanged(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!confirmation) {
      return undefined;
    }

    (async () => {
      const lastInteractedConfirmationInfo =
        await getLastInteractedConfirmationInfo();

      const currentTimestamp = new Date().getTime();

      const timeSinceLastConfirmation =
        currentTimestamp - lastInteractedConfirmationInfo.timestamp;

      const recentlyViewedOtherConfirmation =
        timeSinceLastConfirmation <= CHAIN_CHANGE_THRESHOLD_MILLISECONDS;

      const isDifferentChain =
        lastInteractedConfirmationInfo &&
        lastInteractedConfirmationInfo.chainId !== newChainId;

      const isDifferentOrigin =
        lastInteractedConfirmationInfo &&
        lastInteractedConfirmationInfo.origin !== newOrigin;

      if (
        recentlyViewedOtherConfirmation &&
        (isDifferentChain || isDifferentOrigin) &&
        isMounted
      ) {
        setChainChanged(isDifferentChain);
        setOriginChanged(isDifferentOrigin);

        setTimeout(() => {
          if (isMounted) {
            hideToast();
          }
        }, TOAST_TIMEOUT_MILLISECONDS);
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
  }, [confirmation?.id]);

  if (!chainChanged && !originChanged) {
    return null;
  }

  const text = [];

  if (chainChanged) {
    text.push(t('networkSwitchMessage', [network.name ?? '']));
  }

  if (originChanged) {
    text.push(t('originSwitchMessage', [new URL(newOrigin).host]));
  }

  return (
    <Box className="toast_wrapper">
      <Toast onClose={hideToast} text={text.join('\n')} startAdornment={null} />
    </Box>
  );
};

export default NetworkChangeToastLegacy;
