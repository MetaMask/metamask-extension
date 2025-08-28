import { encodePacked } from '@metamask/abi-utils';
import { Hex, bytesToHex } from '@metamask/utils';
import { Caveat } from '../caveat';
import { DeleGatorEnvironment } from '../environment';
import { isAddress } from '../utils';

export const specificActionERC20TransferBatch =
  'specificActionERC20TransferBatch';

export function specificActionERC20TransferBatchBuilder(
  environment: DeleGatorEnvironment,
  erc20TokenAddress: Hex,
  tokenTransferRecipientAddress: Hex,
  transferAmount: bigint,
  firstTxRecipientAddress: Hex,
  firstTxCalldata: Hex,
): Caveat {
  if (!isAddress(erc20TokenAddress, { strict: false })) {
    throw new Error('Invalid erc20TokenAddress: must be a valid address');
  }

  if (!isAddress(tokenTransferRecipientAddress, { strict: false })) {
    throw new Error(
      'Invalid tokenTransferRecipientAddress: must be a valid address',
    );
  }

  if (typeof transferAmount !== 'bigint' || transferAmount < 0) {
    throw new Error(
      'Invalid transferAmount: must be a non-negative bigint number',
    );
  }

  if (!isAddress(firstTxRecipientAddress, { strict: false })) {
    throw new Error('Invalid firstTxRecipientAddress: must be a valid address');
  }

  if (
    typeof firstTxCalldata !== 'string' ||
    !firstTxCalldata.startsWith('0x')
  ) {
    throw new Error('Invalid firstTxCalldata: must be an hexadecimal string');
  }

  const terms = bytesToHex(
    encodePacked(
      ['address', 'address', 'uint256', 'address', 'bytes'],
      [
        erc20TokenAddress,
        tokenTransferRecipientAddress,
        transferAmount,
        firstTxRecipientAddress,
        firstTxCalldata,
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
