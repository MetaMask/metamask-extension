import BN from 'bn.js';
import { stringifyBalance } from '../../../../hooks/useTokenBalances';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { useSelector } from 'react-redux';
import { AddressBalanceMapping } from '../token-list/token-list';
import {
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountTokenBalancesAcrossChains,
} from '../../../../selectors';
import { Hex } from '@metamask/utils';

type CalculateTokenBalanceParams = {
  isNative: boolean;
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
    }
  } else {
    const hexBalance =
      selectedAccountTokenBalancesAcrossChains[chainId]?.[address];
    if (hexBalance && hexBalance !== '0x0') {
      balance = stringifyBalance(
        new BN(hexToDecimal(hexBalance)),
        new BN(decimals),
      );
    }
  }

  return balance;
}
