import { Hex, bytesToHex } from '@metamask/utils';
import { DeleGatorEnvironment } from '../environment';
import { Caveat } from '../caveat';
import { encodePacked } from '@metamask/abi-utils';
import { isAddress } from '../utils';

export const erc721BalanceChange = 'erc721BalanceChange';

export function erc721BalanceChangeBuilder(
  environment: DeleGatorEnvironment,
  enforceDecrease: boolean,
  token: Hex,
  recipient: Hex,
  tokenId: bigint,
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

  if (typeof tokenId !== 'bigint' || tokenId < 0) {
    throw new Error('Invalid tokenId: must be a non-negative number');
  }

  const terms = bytesToHex(
    encodePacked(
      ['bool', 'address', 'address', 'uint256'],
      [enforceDecrease, token, recipient, tokenId],
    ),
  );

  const {
    caveatEnforcers: { ERC721BalanceChangeEnforcer },
  } = environment;

  return {
    enforcer: ERC721BalanceChangeEnforcer,
    terms,
    args: '0x',
  };
}
