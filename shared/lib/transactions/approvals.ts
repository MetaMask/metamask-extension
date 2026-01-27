import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import { parseApprovalTransactionData } from '../../modules/transaction.utils';

const SIGNATURE_LEGACY = 'function approve(address,uint256)';
const SIGNATURE_PERMIT2 = 'function approve(address,address,uint160,uint48)';
const SIGNATURE_INCREASE_ALLOWANCE =
  'function increaseAllowance(address,uint256)';

// Maximum value for uint160: 2^160 - 1
const MAX_UINT160 = new BigNumber(2).pow(160).minus(1);

/**
 * Validates and sanitizes the input amount value.
 * Removes invalid characters and ensures it's a valid number.
 *
 * @param amount - The amount to sanitize
 * @returns Sanitized amount string
 */
function sanitizeAmount(amount: string | number | BigNumber): string {
  let sanitized: string;

  if (amount instanceof BigNumber) {
    sanitized = amount.toString(10);
  } else if (typeof amount === 'number') {
    sanitized = amount.toString();
  } else {
    // Remove all '#' characters and trim whitespace
    sanitized = amount.replace(/#/gu, '').trim();
  }

  // Validate that the result is a valid number
  if (sanitized === '' || Number.isNaN(Number(sanitized))) {
    throw new Error(`Invalid amount value: ${String(amount)}`);
  }

  return sanitized;
}

export function updateApprovalAmount(
  originalData: Hex,
  newAmount: string | number | BigNumber,
  decimals: number,
): Hex {
  const { name, tokenAddress } =
    parseApprovalTransactionData(originalData) ?? {};

  if (!name) {
    throw new Error('Invalid approval transaction data');
  }

  // Sanitize and validate the input amount
  const sanitizedAmount = sanitizeAmount(newAmount);

  // Calculate the final value with decimals applied
  const multiplier = new BigNumber(10).pow(decimals);
  const calculatedValue = new BigNumber(sanitizedAmount).times(multiplier);

  // Check if value is negative
  if (calculatedValue.isNegative()) {
    throw new Error('Amount cannot be negative');
  }

  // Ensure the value is an integer (no decimals after multiplication)
  if (!calculatedValue.isInteger()) {
    throw new Error(
      `Amount results in non-integer value after applying ${decimals} decimals`,
    );
  }

  let signature = tokenAddress ? SIGNATURE_PERMIT2 : SIGNATURE_LEGACY;

  if (name === 'increaseAllowance') {
    signature = SIGNATURE_INCREASE_ALLOWANCE;
  }

  // For Permit2, validate that the value fits in uint160
  if (signature === SIGNATURE_PERMIT2 && calculatedValue.gt(MAX_UINT160)) {
    throw new Error(
      `Amount exceeds maximum value for uint160: ${calculatedValue.toString(10)}`,
    );
  }

  // Convert to decimal string for ethers.js encoding
  // ethers.js expects decimal strings or numbers, not hex strings
  const valueForEncoding = calculatedValue.toString(10);

  const iface = new Interface([signature]);
  const decoded = iface.decodeFunctionData(name, originalData);

  if (signature === SIGNATURE_PERMIT2) {
    return iface.encodeFunctionData(name, [
      tokenAddress,
      decoded[1],
      valueForEncoding,
      decoded[3],
    ]) as Hex;
  }

  return iface.encodeFunctionData(name, [decoded[0], valueForEncoding]) as Hex;
}
