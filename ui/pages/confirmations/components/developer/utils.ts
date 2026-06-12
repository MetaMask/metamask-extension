import type { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { BigNumber } from 'bignumber.js';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
const erc20Interface = new Interface(ERC20_ABI);

/**
 * Encodes an ERC-20 `transfer(address,uint256)` call for the developer-only
 * trigger buttons (Perps Deposit / Perps Withdraw / MUSD Conversion).
 *
 * Takes a human-readable amount (e.g. `'0'`, `'1.5'`) and scales it by the
 * token's decimals before encoding.
 *
 * @param recipient - ERC-20 transfer recipient.
 * @param amount - Human-readable amount as a decimal string.
 * @param decimals - Token decimals used to scale `amount` to its raw integer form.
 * @returns Encoded `transfer(recipient, rawAmount)` calldata.
 */
export const generateERC20TransferData = (
  recipient: Hex,
  amount: string,
  decimals: number,
): Hex => {
  const multiplier = new BigNumber(10).pow(decimals);
  const amountRaw = new BigNumber(amount).times(multiplier);

  return erc20Interface.encodeFunctionData('transfer', [
    recipient,
    `0x${amountRaw.toString(16)}`,
  ]) as Hex;
};
