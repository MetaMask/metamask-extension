import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Box } from '../../../../../components/component-library';
import { Toast } from '../../../../../components/multichain';
import {
  getLastInteractedConfirmationInfo,
  setLastInteractedConfirmationInfo,
} from '../../../../../store/actions';
import { getCurrentChainId } from '../../../../../selectors';
import { NETWORK_TO_NAME_MAP } from '../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const MILLISECONDS_IN_ONE_MINUTES = 60000;
const MILLISECONDS_IN_FIVE_SECONDS = 5000;

const NetworkChangeToastInner = ({
  confirmation,
}: {
  confirmation: { id: string };
}) => {
  const chainId = useSelector(getCurrentChainId);
  const [toastVisible, setToastVisible] = useState(false);
  const t = useI18nContext();

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
        lastInteractedConfirmationInfo.chainId !== chainId &&
        currentTimestamp - lastInteractedConfirmationInfo.timestamp <=
          MILLISECONDS_IN_ONE_MINUTES &&
        isMounted
      ) {
        setToastVisible(true);
        setTimeout(() => {
          hideToast();
        }, MILLISECONDS_IN_FIVE_SECONDS);
      }
      if (
        (!lastInteractedConfirmationInfo ||
          lastInteractedConfirmationInfo?.id !== confirmation.id) &&
        isMounted
      ) {
        setLastInteractedConfirmationInfo({
          id: confirmation.id,
          chainId,
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
        text={t('networkSwitchMessage', [
          (NETWORK_TO_NAME_MAP as Record<string, string>)[chainId],
        ])}
        startAdornment={null}
      />
    </Box>
  );
};

export default NetworkChangeToastInner;
