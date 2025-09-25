import { encodePacked } from '@metamask/abi-utils';
import { bytesToHex } from '@metamask/utils';
import { hexToDecimal } from '../../../modules/conversion.utils';
import { Caveat } from '../caveat';
import { DeleGatorEnvironment } from '../environment';
import { isAddress, isHex } from '../utils';

export const exactExecution = 'exactExecution';

export function exactExecutionBuilder(
  environment: DeleGatorEnvironment,
  to: string,
  value: string,
  data: string | undefined,
): Caveat {
  if (!isAddress(to, { strict: false })) {
    throw new Error('Invalid to: must be a valid address');
  }

  const valueAsNumber = Number(hexToDecimal(value));
  if (!Number.isInteger(valueAsNumber)) {
    throw new Error('Invalid value: must be an integer');
  }

  if (valueAsNumber < 0) {
    throw new Error('Invalid value: must be a positive integer or zero');
  }

  const safeData = data !== undefined && data !== '0x' ? data : '0x0';
  if (!isHex(safeData, { strict: true })) {
    throw new Error('Invalid data: must be a valid hex string');
  }

  const valueAsBigInt = BigInt(value);
  const terms = bytesToHex(
    encodePacked(
      ['address', 'uint256', 'bytes'],
      [to, valueAsBigInt, safeData],
    ),
  );

  const {
    caveatEnforcers: { ExactExecutionEnforcer },
  } = environment;

  return {
    enforcer: ExactExecutionEnforcer,
    terms,
    args: '0x',
  };
}
