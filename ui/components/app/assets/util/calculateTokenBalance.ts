import BN from 'bn.js';
import { Hex } from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { stringifyBalance } from '../../../../hooks/useTokenBalances';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { AddressBalanceMapping } from '../types';

type CalculateTokenBalanceParams = {
  isNative?: boolean;
  chainId: Hex;
  address: Hex;
  decimals: number;
  nativeBalances: Record<Hex, Hex>;
  selectedAccountTokenBalancesAcrossChains: AddressBalanceMapping;
};

export function calculateTokenBalance({
  isNative,
  chainId,
  address,
  decimals,
  nativeBalances,
  selectedAccountTokenBalancesAcrossChains,
}: CalculateTokenBalanceParams): string | undefined {
  let balance;

  if (isNative) {
    const nativeTokenBalanceHex = nativeBalances?.[chainId];
    if (nativeTokenBalanceHex && nativeTokenBalanceHex !== '0x0') {
      balance = stringifyBalance(
        new BN(hexToDecimal(nativeTokenBalanceHex)),
        new BN(decimals),
        5, // precision for native token balance
      );
    } else {
      balance = '0';
    }
  } else {
    const hexBalance =
      selectedAccountTokenBalancesAcrossChains?.[chainId]?.[
        toChecksumHexAddress(address) as Hex
      ] || selectedAccountTokenBalancesAcrossChains?.[chainId]?.[address];
    if (hexBalance && hexBalance !== '0x0') {
      balance = stringifyBalance(
        new BN(hexToDecimal(hexBalance)),
        new BN(decimals),
      );
    } else {
      balance = '0';
    }
  }

  return balance;
}
