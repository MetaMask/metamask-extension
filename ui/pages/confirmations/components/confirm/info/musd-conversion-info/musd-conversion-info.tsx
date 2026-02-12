import React from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { useConfirmContext } from '../../../../context/confirm';
import {
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
} from '../../../../../../../shared/constants/musd';

export const MusdConversionInfo = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const chainId =
    currentConfirmation?.chainId ?? MUSD_CONVERSION_DEFAULT_CHAIN_ID;

  useAddToken({
    chainId,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  return (
    <CustomAmountInfo
      hasMax
      preferredToken={{
        address: MUSD_TOKEN_ADDRESS,
        chainId,
      }}
    />
  );
};
