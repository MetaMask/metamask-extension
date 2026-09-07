import { useEffect, useMemo, useState } from 'react';
import { isValidHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getTokenStandardAndDetailsByChain } from '../../../../../store/actions';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../useSendType';
import type { SendAlert } from './types';

export function useTokenContractSendAlert(): SendAlert | null {
  const t = useI18nContext();
  const { to, chainId, asset } = useSendContext();
  const { isEvmSendType } = useSendType();
  const [isTokenContract, setIsTokenContract] = useState(false);
  const detectionKey = `${to ?? ''}|${chainId ?? ''}|${isEvmSendType}|${
    asset?.address ?? ''
  }`;
  const [prevDetectionKey, setPrevDetectionKey] = useState(detectionKey);

  if (detectionKey !== prevDetectionKey) {
    setPrevDetectionKey(detectionKey);
    setIsTokenContract(false);
  }

  useEffect(() => {
    let cancelled = false;

    if (
      !to ||
      !chainId ||
      !isEvmSendType ||
      !isValidHexAddress(to) ||
      to.toLowerCase() === asset?.address?.toLowerCase()
    ) {
      return undefined;
    }

    getTokenStandardAndDetailsByChain(to, undefined, undefined, chainId)
      .then((details) => {
        if (!cancelled && details?.standard) {
          setIsTokenContract(true);
        }
      })
      .catch(() => {
        // Ignore errors
      });

    return () => {
      cancelled = true;
    };
  }, [to, chainId, isEvmSendType, asset?.address]);

  return useMemo(
    () =>
      isTokenContract
        ? {
            key: 'tokenContract',
            title: t('smartContractAddress'),
            message: t('smartContractAddressWarning'),
          }
        : null,
    [isTokenContract, t],
  );
}
