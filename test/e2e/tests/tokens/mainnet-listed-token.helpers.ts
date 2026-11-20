import { keccak256, pad, toHex } from 'viem';
import type { Anvil } from '../../seeder/anvil';
import {
  contractConfiguration,
  SMART_CONTRACTS,
} from '../../seeder/smart-contracts';

type Hex = `0x${string}`;

/** DAI on Ethereum Mainnet — present in STATIC_MAINNET_TOKEN_LIST. */
export const MAINNET_LISTED_TOKEN_ADDRESS: Hex =
  '0x6b175474e89094c44da98b954eedeac495271d0f';

export const MAINNET_LISTED_TOKEN_SYMBOL = 'DAI';
export const MAINNET_LISTED_TOKEN_MINTED_AMOUNT = '100';

const TOKEN_NAME = 'Dai Stablecoin';
const TOKEN_SYMBOL = 'DAI';
const TOKEN_DECIMALS = 18;
const MINTED_AMOUNT = 100;

/**
 * Flat storage slots copied from the deployed replica to the Mainnet-listed
 * address: token metadata (name, symbol, decimals, total supply) and the
 * mapping base slots.
 */
const FLAT_STORAGE_SLOTS_TO_COPY = 12;

/**
 * Deploys the test ERC-20 (HST) with DAI metadata on the local node, then
 * moves its code and storage — including the account's mapping-derived
 * balance entry — to `MAINNET_LISTED_TOKEN_ADDRESS` with `anvil_setCode` and
 * `anvil_setStorageAt`. The local chain (a non-Mainnet network) then carries a
 * real ERC-20 at an address that is in `STATIC_MAINNET_TOKEN_LIST`, which is
 * the situation fork chains like PulseChain create for every Mainnet token.
 *
 * @param localNode - The running local Anvil node.
 * @param accountAddress - Address whose token balance is carried over to the
 * Mainnet-listed address (the extension's wallet account).
 */
export async function deployErc20AtMainnetListedAddress(
  localNode: Anvil,
  accountAddress: string,
): Promise<void> {
  const { walletClient, publicClient, testClient } = localNode.getProvider();
  const hst = contractConfiguration[SMART_CONTRACTS.HST];
  const account = accountAddress as Hex;

  const deployer = (await walletClient.getAddresses())[0] as Hex;
  const deployHash = await walletClient.deployContract({
    abi: hst.abi,
    account: deployer,
    args: [MINTED_AMOUNT, TOKEN_NAME, TOKEN_DECIMALS, TOKEN_SYMBOL],
    bytecode: hst.bytecode as Hex,
  });
  await testClient.mine({ blocks: 1 });
  const receipt = await publicClient.getTransactionReceipt({
    hash: deployHash,
  });
  const replicaAddress = receipt.contractAddress as Hex;

  const code = await publicClient.getCode({ address: replicaAddress });
  if (!code) {
    throw new Error('HST replica deployment produced no code to copy');
  }
  await testClient.setCode({
    address: MAINNET_LISTED_TOKEN_ADDRESS,
    bytecode: code,
  });

  for (let slot = 0; slot < FLAT_STORAGE_SLOTS_TO_COPY; slot++) {
    const value = await publicClient.getStorageAt({
      address: replicaAddress,
      slot: toHex(slot),
    });
    if (value === undefined || BigInt(value) === 0n) {
      continue;
    }
    await testClient.setStorageAt({
      address: MAINNET_LISTED_TOKEN_ADDRESS,
      index: slot,
      value,
    });
  }

  // ERC-20 balances and allowances live at keccak256(pad(account) . pad(slot))
  // off each mapping base slot, so the constructor-minted balance is copied by
  // mirroring the account's derived entries as well.
  for (let slot = 0; slot < FLAT_STORAGE_SLOTS_TO_COPY; slot++) {
    const derivedIndex = keccak256(
      `0x${pad(account, { size: 32 }).slice(2)}${pad(toHex(BigInt(slot)), {
        size: 32,
      }).slice(2)}`,
    );
    const value = await publicClient.getStorageAt({
      address: replicaAddress,
      slot: derivedIndex,
    });
    if (value === undefined || BigInt(value) === 0n) {
      continue;
    }
    await testClient.setStorageAt({
      address: MAINNET_LISTED_TOKEN_ADDRESS,
      index: derivedIndex,
      value,
    });
  }
}
