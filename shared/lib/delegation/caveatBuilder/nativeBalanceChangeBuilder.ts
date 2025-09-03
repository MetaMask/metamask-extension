import { Hex, bytesToHex } from '@metamask/utils';
import { encodePacked } from '@metamask/abi-utils';
import { DeleGatorEnvironment } from '../environment';
import { Caveat } from '../caveat';
import { isAddress } from '../utils';

export const nativeBalanceChange = 'nativeBalanceChange';

export function nativeBalanceChangeBuilder(
  environment: DeleGatorEnvironment,
  enforceDecrease: boolean,
  recipient: Hex,
  amount: bigint,
): Caveat {
  if (typeof enforceDecrease !== 'boolean') {
    throw new Error('Invalid enforceDecrease: must be a boolean');
  }

  if (!isAddress(recipient, { strict: false })) {
    throw new Error('Invalid recipient: must be a valid address');
  }

  if (typeof amount !== 'bigint' || amount < 0) {
    throw new Error('Invalid amount: must be a non-negative number');
  }

  const terms = bytesToHex(
    encodePacked(
      ['bool', 'address', 'uint256'],
      [enforceDecrease, recipient, amount],
    ),
  );

  const {
    caveatEnforcers: { NativeBalanceChangeEnforcer },
  } = environment;

  return {
    enforcer: NativeBalanceChangeEnforcer,
    terms,
    args: '0x',
  };
}
