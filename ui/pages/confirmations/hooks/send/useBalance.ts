import { ERC1155 } from '@metamask/controller-utils';
import { useMemo } from 'react';

import { Numeric } from '../../../../../shared/modules/Numeric';
import { Asset } from '../../types/send';
import { formatToFixedDecimals, toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';

const getBalance = (asset?: Asset) => {
  if (!asset) {
    return {
      balance: '0',
      decimals: 0,
      rawBalanceNumeric: new Numeric('0', 10),
    };
  }

  const rawBalanceHex = asset?.rawBalance ?? '0x0';

  return {
    balance: formatToFixedDecimals(
      toTokenMinimalUnit(rawBalanceHex, asset.decimals),
      asset.decimals,
    ),
    decimals: asset.decimals,
    rawBalanceNumeric: new Numeric(rawBalanceHex, 16).toBase(10),
  };
};

export const useBalance = () => {
  const { asset } = useSendContext();

  const { balance, decimals, rawBalanceNumeric } = useMemo(() => {
    if (asset?.standard === ERC1155) {
      const bal = asset?.balance ?? '0';
      return {
        balance: bal,
        decimals: 0,
        rawBalanceNumeric: new Numeric(bal, 10),
      };
    }
    return getBalance(asset);
  }, [asset]);

  return {
    balance,
    decimals,
    rawBalanceNumeric,
  };
};
