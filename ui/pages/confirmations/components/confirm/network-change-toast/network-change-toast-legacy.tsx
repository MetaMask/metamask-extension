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
  confirmation: { id: string; chainId: string };
}) => {
  const newChainId = confirmation?.chainId;
  const [toastVisible, setToastVisible] = useState(false);
  const t = useI18nContext();

  const network = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, newChainId),
  );

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
  }, [confirmation?.id]);

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
