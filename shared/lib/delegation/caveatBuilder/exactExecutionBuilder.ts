import { hexToDecimal } from '../../../modules/conversion.utils';
import { Caveat } from '../caveat';
import { DeleGatorEnvironment } from '../environment';
import { encodeSingleExecution } from '../execution';
import { isAddress, isHex, type Hex } from '../utils';

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

  const safeData = data !== undefined && data !== '0x' ? data : '0x';
  if (safeData !== '0x' && !isHex(safeData, { strict: true })) {
    throw new Error('Invalid data: must be a valid hex string');
  }

  const valueAsBigInt = BigInt(value);
  // Reuse the execution encoder so caveat terms stay byte-identical to the execution payload.
  const terms = encodeSingleExecution({
    target: to as Hex,
    value: valueAsBigInt,
    callData: safeData as Hex,
  });

  const {
    caveatEnforcers: { ExactExecutionEnforcer },
  } = environment;

  return {
    enforcer: ExactExecutionEnforcer,
    terms,
    args: '0x',
  };
}
