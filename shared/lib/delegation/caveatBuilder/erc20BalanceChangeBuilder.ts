import { Hex, bytesToHex } from '@metamask/utils';
import { encodePacked } from '@metamask/abi-utils';
import { DeleGatorEnvironment } from '../environment';
import { Caveat } from '../caveat';
import { isAddress } from '../utils';

export const erc20BalanceChange = 'erc20BalanceChange';

export function erc20BalanceChangeBuilder(
  environment: DeleGatorEnvironment,
  enforceDecrease: boolean,
  token: Hex,
  recipient: Hex,
  amount: bigint,
): Caveat {
  if (typeof enforceDecrease !== 'boolean') {
    throw new Error('Invalid enforceDecrease: must be a boolean');
  }

  if (!isAddress(token, { strict: false })) {
    throw new Error('Invalid token: must be a valid address');
  }

  if (!isAddress(recipient, { strict: false })) {
    throw new Error('Invalid recipient: must be a valid address');
  }

  if (typeof amount !== 'bigint' || amount < 0) {
    throw new Error('Invalid amount: must be a non-negative number');
  }

  const terms = bytesToHex(
    encodePacked(
      ['bool', 'address', 'address', 'uint256'],
      [enforceDecrease, token, recipient, amount],
    ),
  );

  const {
    caveatEnforcers: { ERC20BalanceChangeEnforcer },
  } = environment;

  return {
    enforcer: ERC20BalanceChangeEnforcer,
    terms,
    args: '0x',
  };
}
