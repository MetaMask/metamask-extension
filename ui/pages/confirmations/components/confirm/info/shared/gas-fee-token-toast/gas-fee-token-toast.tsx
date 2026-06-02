
import { Hex } from '@metamask/utils';
import { toast } from '@metamask/design-system-react';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  useGasFeeToken,
  useSelectedGasFeeToken,
} from '../../hooks/useGasFeeToken';
import { GasFeeTokenIcon } from '../gas-fee-token-icon';
import React, { useEffect, useRef } from 'react';

const TOAST_TIMEOUT_MILLISECONDS = 5 * 1000; // 5 Seconds

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function GasFeeTokenToast() {
  const t = useI18nContext();

  const nativeGasFeeToken = useGasFeeToken({
    tokenAddress: NATIVE_TOKEN_ADDRESS,
  });

  const selectedGasFeeToken = useSelectedGasFeeToken() ?? nativeGasFeeToken;

  const previousGasFeeTokenRef = useRef<Hex>(NATIVE_TOKEN_ADDRESS);

  useEffect(() => {
    const selectedTokenAddress =
      selectedGasFeeToken?.tokenAddress ?? NATIVE_TOKEN_ADDRESS;

    if (selectedTokenAddress === previousGasFeeTokenRef.current) {
      return undefined;
    }

    previousGasFeeTokenRef.current = selectedTokenAddress;

    const timeoutId = setTimeout(() => {
      toast.dismiss();
    }, TOAST_TIMEOUT_MILLISECONDS);

    toast({
      severity: 'default',
      onClose: () => {
        clearTimeout(timeoutId);
        toast.dismiss();
      },
      title: t('confirmGasFeeTokenToast', [
        <b key="symbol">{selectedGasFeeToken?.symbol}</b>,
      ]),
      startAccessory: (
        <GasFeeTokenIcon tokenAddress={selectedTokenAddress} />
      ),
      hasNoTimeout: true,
    });

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [selectedGasFeeToken?.symbol, selectedGasFeeToken?.tokenAddress, t]);

  return null;
}
