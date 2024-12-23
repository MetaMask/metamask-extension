import { query } from '@metamask/controller-utils';
import EthQuery from '@metamask/eth-query';
import { Hex } from '@metamask/utils';
import { addHexPrefix, stripHexPrefix } from '@ethereumjs/util';

const IMPLEMENTATION_STORAGE_SLOTS = [
  // org.zeppelinos.proxy.implementation
  '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3',

  // eip1967.proxy.implementation
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
];

const EMPTY_RESULT = '0'.padEnd(64, '0');

export async function getContractProxyAddress(
  contractAddress: Hex,
  ethQuery: EthQuery,
): Promise<Hex | undefined> {
  const responses = await Promise.all(
    IMPLEMENTATION_STORAGE_SLOTS.map(
      (storageSlot) =>
        query(ethQuery, 'eth_getStorageAt', [
          contractAddress,
          storageSlot,
          'latest',
        ]) as Promise<Hex>,
    ),
  );

  const result = responses.find(
    (response) => stripHexPrefix(response) !== EMPTY_RESULT,
  );

  return result && (addHexPrefix(result.slice(26)) as Hex | undefined);
}
