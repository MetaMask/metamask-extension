import React, { useEffect, useRef } from 'react';

import { Hex } from '@metamask/utils';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { SECOND } from '../../../../../../../../shared/constants/time';
import {
  toast,
  ToastContent,
} from '../../../../../../../components/ui/toast/toast';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useTransactionMetadataRequestOptional } from '../../../../../hooks/transactions/useTransactionMetadataRequest';
import { TokenIcon } from '../../../../token-icon';
import {
  useGasFeeToken,
  useSelectedGasFeeToken,
} from '../../hooks/useGasFeeToken';

const TOAST_ID = 'gas-fee-token-toast';
const TOAST_DURATION = 5 * SECOND;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function GasFeeTokenToast() {
  const t = useI18nContext();
  const chainId = useTransactionMetadataRequestOptional()?.chainId;

  const nativeGasFeeToken = useGasFeeToken({
    tokenAddress: NATIVE_TOKEN_ADDRESS,
  });

  const selectedGasFeeToken = useSelectedGasFeeToken() ?? nativeGasFeeToken;
  const selectedTokenAddress =
    selectedGasFeeToken?.tokenAddress ?? NATIVE_TOKEN_ADDRESS;

  const previousGasFeeTokenRef = useRef<Hex>(NATIVE_TOKEN_ADDRESS);

  useEffect(() => {
    return () => {
      toast.dismiss(TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (!chainId || selectedTokenAddress === previousGasFeeTokenRef.current) {
      return;
    }

    previousGasFeeTokenRef.current = selectedTokenAddress;

    toast.success(
      <ToastContent
        title={t('confirmGasFeeTokenToast', [
          selectedGasFeeToken?.symbol ?? '',
        ])}
        dataTestId={TOAST_ID}
      />,
      {
        id: TOAST_ID,
        duration: TOAST_DURATION,
        style: { visibility: 'visible' },
        icon: (
          <TokenIcon
            chainId={chainId}
            tokenAddress={selectedTokenAddress}
            symbol={selectedGasFeeToken?.symbol}
            size="sm"
          />
        ),
      },
    );
  }, [chainId, selectedGasFeeToken?.symbol, selectedTokenAddress, t]);

  return null;
}
