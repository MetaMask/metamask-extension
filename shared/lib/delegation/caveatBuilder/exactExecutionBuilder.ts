import { encodePacked } from '@metamask/abi-utils';
import { Hex, bytesToHex } from '@metamask/utils';
import { Caveat } from '../caveat';
import { DeleGatorEnvironment } from '../environment';

export const exactExecution = 'exactExecution';

export function exactExecutionBuilder(
  environment: DeleGatorEnvironment,
  expectedExecution: Hex,
): Caveat {
  if (typeof expectedExecution !== 'string') {
    throw new Error('Invalid expectedExecution: must be a hexadecimal string');
  }

  const terms = bytesToHex(encodePacked(['bytes'], [expectedExecution]));

  const {
    caveatEnforcers: { ExactExecutionEnforcer },
  } = environment;

  return {
    enforcer: ExactExecutionEnforcer,
    terms,
    args: '0x',
  };
}
