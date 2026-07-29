import {
  isEvmAccountType,
  SolAccountType,
  SolScope,
} from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { CaipAccountId, CaipChainId } from '@metamask/utils';
import { KnownCaipNamespace, toCaipAccountId } from '@metamask/utils';

/**
 * Networks the DeFi balances (v6 multiaccount) endpoint supports.
 * Cross-section of the supported chains from:
 * https://developers.zerion.io/supported-blockchains
 * https://accounts.api.cx.metamask.io/v2/supportedNetworks
 */
export const DEFI_SUPPORTED_NETWORKS: readonly CaipChainId[] = [
  'eip155:1',
  'eip155:137',
  'eip155:56',
  'eip155:1329',
  'eip155:43114',
  'eip155:59144',
  'eip155:8453',
  'eip155:10',
  'eip155:42161',
  'eip155:143',
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  'eip155:999',
  'eip155:5042',
];

const SOLANA_MAINNET_CAIP_CHAIN_ID: CaipChainId = SolScope.Mainnet;

export type DeFiBalancesQuery = {
  /** CAIP-2 networks to query, deduped across accounts. */
  networks: CaipChainId[];
  /**
   * Request CAIP-10 account IDs → internal MetaMask account IDs
   * (`InternalAccount.id`). EVM keys use the all-chains reference and a
   * lowercased address; Solana keys keep address case.
   */
  internalAccountIdByCaip: Map<string, string>;
};

/**
 * Builds an EVM CAIP-10 account ID that spans every EVM chain (reference `0`).
 * Addresses are lowercased because EVM addresses are case-insensitive.
 *
 * @param address - The EVM account address.
 * @returns The CAIP-10 account ID for the address.
 */
function toEvmCaipAccountId(address: string): CaipAccountId {
  return toCaipAccountId(KnownCaipNamespace.Eip155, '0', address.toLowerCase());
}

/**
 * Builds the account IDs and networks to request DeFi positions for, from the
 * accounts in the selected account group.
 *
 * Picks the group's EVM account (queried across all supported EVM chains) and
 * its Solana account (queried on supported Solana chains). Enabled-network
 * filtering is intentionally omitted here: positions are stored per chain, so
 * the client can filter by enabled networks when reading state.
 *
 * @param internalAccounts - Accounts belonging to the selected account group.
 * @returns Networks and a CAIP→internal account ID map for the v6 multiaccount
 * balances request. Map keys are the CAIP account IDs to query.
 */
export function buildDeFiBalancesQuery(
  internalAccounts: InternalAccount[],
): DeFiBalancesQuery {
  const evmNetworks = DEFI_SUPPORTED_NETWORKS.filter((network) =>
    network.startsWith(`${KnownCaipNamespace.Eip155}:`),
  );
  const solanaNetworks = DEFI_SUPPORTED_NETWORKS.filter((network) =>
    network.startsWith(`${KnownCaipNamespace.Solana}:`),
  );

  const networks: CaipChainId[] = [];
  const internalAccountIdByCaip = new Map<string, string>();

  const evmAccount = internalAccounts.find((account) =>
    isEvmAccountType(account.type),
  );
  if (evmAccount && evmNetworks.length > 0) {
    internalAccountIdByCaip.set(
      toEvmCaipAccountId(evmAccount.address),
      evmAccount.id,
    );
    networks.push(...evmNetworks);
  }

  const solanaAccount = internalAccounts.find(
    (account) => account.type === SolAccountType.DataAccount,
  );
  if (solanaAccount && solanaNetworks.length > 0) {
    const [, solanaReference] = SOLANA_MAINNET_CAIP_CHAIN_ID.split(':');
    internalAccountIdByCaip.set(
      toCaipAccountId(
        KnownCaipNamespace.Solana,
        solanaReference,
        solanaAccount.address,
      ),
      solanaAccount.id,
    );
    networks.push(...solanaNetworks);
  }

  return {
    networks: [...new Set(networks)] as CaipChainId[],
    internalAccountIdByCaip,
  };
}
