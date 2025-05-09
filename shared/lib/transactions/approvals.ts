import { Hex, add0x } from '@metamask/utils';
import { parseApprovalTransactionData } from '../../modules/transaction.utils';
import BigNumber from 'bignumber.js';
import { Interface } from '@ethersproject/abi';

const SIGNATURE_LEGACY = 'function approve(address,uint256)';
const SIGNATURE_PERMIT2 = 'function approve(address,address,uint160,uint48)';

export function updateApprovalAmount(
  originalData: Hex,
  newAmount: string | number | BigNumber,
  decimals: number,
): Hex {
  const { tokenAddress } = parseApprovalTransactionData(originalData) ?? {};
  const signature = tokenAddress ? SIGNATURE_PERMIT2 : SIGNATURE_LEGACY;
  const multiplier = new BigNumber(10).pow(decimals);
  const value = add0x(new BigNumber(newAmount).times(multiplier).toString(16));

  const decoded = new Interface([signature]).decodeFunctionData(
    'approve',
    originalData,
  );

  if (tokenAddress) {
    return new Interface([SIGNATURE_PERMIT2]).encodeFunctionData('approve', [
      tokenAddress,
      decoded[1],
      value,
      decoded[3],
    ]) as Hex;
  }

  return new Interface([SIGNATURE_LEGACY]).encodeFunctionData('approve', [
    decoded[0],
    value,
  ]) as Hex;
}
