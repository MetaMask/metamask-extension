import React, { useCallback, useState } from 'react';

import { Hex } from '@metamask/utils';
import { Box } from '../../../../../../../components/component-library';
import { Toast } from '../../../../../../../components/multichain';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  NATIVE_TOKEN_ADDRESS,
  useGasFeeToken,
  useSelectedGasFeeToken,
} from '../../hooks/useGasFeeToken';
import { GasFeeTokenIcon } from '../gas-fee-token-icon';

const TOAST_TIMEOUT_MILLISECONDS = 5 * 1000; // 5 Seconds

export function GasFeeTokenToast() {
  const t = useI18nContext();
  const [showToast, setShowToast] = useState(false);

  const nativeGasFeeToken = useGasFeeToken({
    tokenAddress: NATIVE_TOKEN_ADDRESS,
  });

  const selectedGasFeeToken = useSelectedGasFeeToken() ?? nativeGasFeeToken;

  const [previousGasFeeToken, setPreviousGasFeeToken] =
    useState<Hex>(NATIVE_TOKEN_ADDRESS);

  const hideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  if (selectedGasFeeToken?.tokenAddress !== previousGasFeeToken) {
    setPreviousGasFeeToken(
      selectedGasFeeToken?.tokenAddress ?? NATIVE_TOKEN_ADDRESS,
    );

    setShowToast(true);

    setTimeout(() => {
      hideToast();
    }, TOAST_TIMEOUT_MILLISECONDS);
  }

  if (!showToast) {
    return null;
  }

  return (
    <Box className="toast_wrapper">
      <Toast
        onClose={hideToast}
        text={t('confirmGasFeeTokenToast', [
          <b>{selectedGasFeeToken?.symbol}</b>,
        ])}
        startAdornment={
          <>
            <GasFeeTokenIcon
              tokenAddress={
                selectedGasFeeToken?.tokenAddress ?? NATIVE_TOKEN_ADDRESS
              }
            />
          </>
        }
      />
    </Box>
  );
}
