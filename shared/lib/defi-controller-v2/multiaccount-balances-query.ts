import {
  isEvmAccountType,
  SolAccountType,
  SolScope,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  CaipAccountId,
  CaipChainId,
  KnownCaipNamespace,
  toCaipAccountId,
} from '@metamask/utils';
import { toEvmCaipAccountId } from '../multichain/scope-utils';

export const DEFI_SUPPORTED_NETWORKS = [
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
] as const satisfies readonly CaipChainId[];

export const SOLANA_MAINNET_CAIP_CHAIN_ID =
  SolScope.Mainnet as (typeof DEFI_SUPPORTED_NETWORKS)[number];

export type MultiAccountBalanceAccountQuery = {
  caipAccountId: CaipAccountId;
  internalAccountId: string;
  networks: CaipChainId[];
};

export type MultiAccountBalancesQueryParams = {
  accounts: MultiAccountBalanceAccountQuery[];
  accountIds: CaipAccountId[];
  networks: CaipChainId[];
};

export type BuildMultiAccountBalancesUrlOptions = {
  baseUrl?: string;
  includeDeFiBalances?: boolean;
  forceFetchDeFiPositions?: boolean;
  includePrices?: boolean;
  vsCurrency?: string;
};

export const DEFI_BALANCES_V6_REQUEST_OPTIONS = {
  includeDeFiBalances: true,
  forceFetchDeFiPositions: true,
  includePrices: true,
  vsCurrency: 'usd',
} as const;

export type MultiAccountBalancesV6ApiParams = {
  accountIds: CaipAccountId[];
  networks: CaipChainId[];
  includeDeFiBalances: boolean;
  forceFetchDeFiPositions: boolean;
  includePrices: boolean;
  vsCurrency: string;
};

/**
 * Maps a multi-account balances query into v6 Accounts API request params.
 *
 * @param balancesQuery - Query params derived from the selected account group.
 * @param vsCurrency - Fiat currency for returned prices.
 * @returns Request params for the v6 multiaccount balances endpoint.
 */
export function getMultiAccountBalancesV6ApiParams(
  balancesQuery: MultiAccountBalancesQueryParams,
  vsCurrency: string = DEFI_BALANCES_V6_REQUEST_OPTIONS.vsCurrency,
): MultiAccountBalancesV6ApiParams {
  return {
    accountIds: balancesQuery.accountIds,
    networks: balancesQuery.networks,
    ...DEFI_BALANCES_V6_REQUEST_OPTIONS,
    vsCurrency: vsCurrency.toLowerCase(),
  };
}

const DEFAULT_BALANCES_API_BASE_URL =
  'https://accounts.api.cx.metamask.io/v6/multiaccount/balances';

/**
 * Returns supported DeFi networks that are also enabled in the wallet.
 *
 * @param enabledCaipChainIds - All enabled networks as CAIP chain IDs.
 * @param supportedNetworks - Supported networks for the DeFi balances API.
 * @returns Intersection of enabled and supported networks.
 */
export function getEnabledSupportedDefiNetworks(
  enabledCaipChainIds: CaipChainId[],
  supportedNetworks: readonly CaipChainId[] = DEFI_SUPPORTED_NETWORKS,
): CaipChainId[] {
  const enabledNetworkSet = new Set(enabledCaipChainIds);

  return supportedNetworks.filter((network) =>
    enabledNetworkSet.has(network),
  ) as CaipChainId[];
}

/**
 * Builds per-account query entries for the v6 multiaccount balances API from
 * the internal accounts in a selected account group.
 *
 * @param internalAccounts - Internal accounts belonging to the selected group.
 * @param enabledCaipChainIds - All enabled networks as CAIP chain IDs.
 * @param supportedNetworks - Supported networks for the DeFi balances API.
 * @returns Account query entries and flattened account/network params.
 */
export function buildMultiAccountBalancesQuery(
  internalAccounts: InternalAccount[],
  enabledCaipChainIds: CaipChainId[],
  supportedNetworks: readonly CaipChainId[] = DEFI_SUPPORTED_NETWORKS,
): MultiAccountBalancesQueryParams {
  const enabledSupportedNetworks = getEnabledSupportedDefiNetworks(
    enabledCaipChainIds,
    supportedNetworks,
  );

  const evmNetworks = enabledSupportedNetworks.filter((network) =>
    network.startsWith(`${KnownCaipNamespace.Eip155}:`),
  );
  const solanaNetworks = enabledSupportedNetworks.filter((network) =>
    network.startsWith(`${KnownCaipNamespace.Solana}:`),
  );

  const accounts: MultiAccountBalanceAccountQuery[] = [];

  const evmAccount = internalAccounts.find((account) =>
    isEvmAccountType(account.type),
  );
  if (evmAccount && evmNetworks.length > 0) {
    accounts.push({
      caipAccountId: toEvmCaipAccountId(evmAccount.address),
      internalAccountId: evmAccount.id,
      networks: evmNetworks,
    });
  }

  const solanaAccount = internalAccounts.find(
    (account) => account.type === SolAccountType.DataAccount,
  );
  if (solanaAccount && solanaNetworks.length > 0) {
    const [, solanaReference] = SOLANA_MAINNET_CAIP_CHAIN_ID.split(':');

    accounts.push({
      caipAccountId: toCaipAccountId(
        KnownCaipNamespace.Solana,
        solanaReference,
        solanaAccount.address,
      ),
      internalAccountId: solanaAccount.id,
      networks: solanaNetworks,
    });
  }

  const accountIds = accounts.map((account) => account.caipAccountId);
  const networks = [
    ...new Set(accounts.flatMap((account) => account.networks)),
  ] as CaipChainId[];

  return {
    accounts,
    accountIds,
    networks,
  };
}

/**
 * Builds the v6 multiaccount balances URL for DeFi position fetching.
 *
 * @param query - Account and network query params.
 * @param options - Optional URL and query flag overrides.
 * @param options.baseUrl
 * @param options.includeDeFiBalances
 * @param options.forceFetchDeFiPositions
 * @param options.includePrices
 * @param options.vsCurrency
 * @returns Fully formed balances API URL.
 */
export function buildMultiAccountBalancesUrl(
  query: MultiAccountBalancesQueryParams,
  {
    baseUrl = DEFAULT_BALANCES_API_BASE_URL,
    includeDeFiBalances = true,
    forceFetchDeFiPositions = true,
    includePrices = true,
    vsCurrency = 'usd',
  }: BuildMultiAccountBalancesUrlOptions = {},
): string {
  const url = new URL(baseUrl);

  url.searchParams.set(
    'includeDeFiBalances',
    String(includeDeFiBalances),
  );
  url.searchParams.set(
    'forceFetchDeFiPositions',
    String(forceFetchDeFiPositions),
  );
  url.searchParams.set('includePrices', String(includePrices));
  url.searchParams.set('vsCurrency', vsCurrency);

  if (query.accountIds.length > 0) {
    url.searchParams.set('accountIds', query.accountIds.join(','));
  }

  if (query.networks.length > 0) {
    url.searchParams.set('networks', query.networks.join(','));
  }

  return url.toString();
}
