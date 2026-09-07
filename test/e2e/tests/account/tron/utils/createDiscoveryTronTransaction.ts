import { base58AddressToHex } from '../../../../seeder/tron/assets';
import {
  SUN_PER_TRX,
  TRON_ACCOUNT_ADDRESS,
} from '../../../tron/mocks/common-tron';

/**
 * Builds a mocked confirmed TRX transfer to the given Tron address, as the
 * asset-discovery endpoint would return it, so the account is discovered
 * with a balance and a transaction.
 *
 * @param address - The base58 Tron address receiving the transfer.
 * @returns The raw discovery transaction object.
 */
/* eslint-disable @typescript-eslint/naming-convention */
export function createDiscoveryTronTransaction(address: string) {
  const timestamp = Date.now() - 60_000;
  return {
    ret: [{ contractRet: 'SUCCESS', fee: 0 }],
    txID: `1${base58AddressToHex(address).slice(2)}`.padEnd(64, '0'),
    blockNumber: 77_000_000,
    block_timestamp: timestamp,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: SUN_PER_TRX,
              owner_address: base58AddressToHex(TRON_ACCOUNT_ADDRESS),
              to_address: base58AddressToHex(address),
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      expiration: timestamp + 60_000,
      ref_block_bytes: '0000',
      ref_block_hash: '0000000000000000',
      timestamp,
    },
  };
}
/* eslint-enable @typescript-eslint/naming-convention */
