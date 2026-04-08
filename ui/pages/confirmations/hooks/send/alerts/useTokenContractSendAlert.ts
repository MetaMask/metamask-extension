import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    setIsTokenContract(false);

    if (!to || !chainId || !isEvmSendType || !isValidHexAddress(to)) {
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

  if (!isTokenContract) {
    return null;
  }

  return {
    key: 'tokenContract',
    title: t('smartContractAddress'),
    message: t('smartContractAddressWarning'),
  };
}
