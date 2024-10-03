import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Hex } from '@metamask/utils';
import { Box } from '../../../../../components/component-library';
import { Toast } from '../../../../../components/multichain';
import {
  getLastInteractedConfirmationInfo,
  setLastInteractedConfirmationInfo,
} from '../../../../../store/actions';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const CHAIN_CHANGE_THRESHOLD_MILLISECONDS = 60 * 1000; // 1 Minute
const TOAST_TIMEOUT_MILLISECONDS = 5 * 1000; // 5 Seconds

const NetworkChangeToastLegacy = ({
  confirmation,
}: {
  confirmation: { id: string; chainId: string };
}) => {
  const chainId = useSelector(getCurrentChainId);
  const newChainId = confirmation?.chainId ?? chainId;
  const [toastVisible, setToastVisible] = useState(false);
  const t = useI18nContext();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const network = networkConfigurations[newChainId as Hex];

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, [setToastVisible]);

  useEffect(() => {
    let isMounted = true;
    if (!confirmation) {
      return undefined;
    }
    (async () => {
      const lastInteractedConfirmationInfo =
        await getLastInteractedConfirmationInfo();
      const currentTimestamp = new Date().getTime();
      if (
        lastInteractedConfirmationInfo &&
        lastInteractedConfirmationInfo.chainId !== newChainId &&
        currentTimestamp - lastInteractedConfirmationInfo.timestamp <=
          CHAIN_CHANGE_THRESHOLD_MILLISECONDS &&
        isMounted
      ) {
        setToastVisible(true);
        setTimeout(() => {
          if (isMounted) {
            hideToast();
          }
        }, TOAST_TIMEOUT_MILLISECONDS);
      }
      if (
        (!lastInteractedConfirmationInfo ||
          lastInteractedConfirmationInfo?.id !== confirmation.id) &&
        isMounted
      ) {
        setLastInteractedConfirmationInfo({
          id: confirmation.id,
          chainId: newChainId,
          timestamp: new Date().getTime(),
        });
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [confirmation?.id, chainId]);

  if (!toastVisible) {
    return null;
  }

  return (
    <Box className="toast_wrapper">
      <Toast
        onClose={hideToast}
        text={t('networkSwitchMessage', [network.name ?? ''])}
        startAdornment={null}
      />
    </Box>
  );
};

export default NetworkChangeToastLegacy;
