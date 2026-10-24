import { Interface } from '@ethersproject/abi';
import type { Hex } from '@metamask/utils';

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount)'];
let erc20Interface: Interface | null = null;

function getErc20Interface(): Interface {
  if (!erc20Interface) {
    erc20Interface = new Interface(ERC20_TRANSFER_ABI);
  }
  return erc20Interface;
}

/**
 * ABI-encode an ERC20 `transfer(address,uint256)` call.
 *
 * @param to - Recipient address.
 * @param amountRaw - Amount in token base units, hex-encoded (for example `'0x0'`).
 * @returns Calldata ready to assign to `txParams.data`.
 */
export function encodeErc20Transfer(to: Hex, amountRaw: Hex): Hex {
  return getErc20Interface().encodeFunctionData('transfer', [
    to,
    amountRaw,
  ]) as Hex;
}
