import { encodePacked } from '@metamask/abi-utils';
import { Hex, bytesToHex } from '@metamask/utils';
import { hexToDecimal } from '../../../modules/conversion.utils';
import { Caveat } from '../caveat';
import { DeleGatorEnvironment } from '../environment';
import { isAddress, isHex } from '../utils';

export const specificActionERC20TransferBatch =
  'specificActionERC20TransferBatch';

export function specificActionERC20TransferBatchBuilder(
  environment: DeleGatorEnvironment,
  tokenAddress: Hex,
  recipient: Hex,
  amount: Hex,
  firstTarget: string,
  firstValue: Hex,
  firstCalldata: string | undefined,
): Caveat {
  if (!isAddress(tokenAddress, { strict: false })) {
    throw new Error('Invalid tokenAddress: must be a valid address');
  }

  if (!isAddress(recipient, { strict: false })) {
    throw new Error('Invalid recipient: must be a valid address');
  }

  const amountAsNumber = Number(hexToDecimal(amount));
  if (!Number.isInteger(amountAsNumber)) {
    throw new Error('Invalid amount: must be an integer');
  }

  if (amountAsNumber < 0) {
    throw new Error('Invalid amount: must be a positive integer or zero');
  }

  if (!isAddress(firstTarget, { strict: false })) {
    throw new Error('Invalid firstTarget: must be a valid address');
  }

  const firstValueAsNumber = Number(hexToDecimal(firstValue));
  if (!Number.isInteger(firstValueAsNumber)) {
    throw new Error('Invalid firstValue: must be an integer');
  }

  if (firstValueAsNumber < 0) {
    throw new Error('Invalid firstValue: must be a positive integer or zero');
  }

  const safeFirstCalldata =
    firstCalldata !== undefined && firstCalldata !== '0x'
      ? firstCalldata
      : '0x';
  if (
    safeFirstCalldata !== '0x' &&
    !isHex(safeFirstCalldata, { strict: true })
  ) {
    throw new Error('Invalid firstCalldata: must be an hexadecimal string');
  }

  const amountAsBigInt = BigInt(amount);
  const firstValueAsBigInt = BigInt(firstValue);
  const terms = bytesToHex(
    encodePacked(
      ['address', 'address', 'uint256', 'address', 'uint256', 'bytes'],
      [
        tokenAddress,
        recipient,
        amountAsBigInt,
        firstTarget,
        firstValueAsBigInt,
        safeFirstCalldata,
      ],
    ),
  );

  const {
    caveatEnforcers: { SpecificActionERC20TransferBatchEnforcer },
  } = environment;

  return {
    enforcer: SpecificActionERC20TransferBatchEnforcer,
    terms,
    args: '0x',
  };
}
