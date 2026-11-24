import { toChecksumHexAddress } from '../../../shared/lib/hexstring-utils';

const ERC20_ASSET_ID_PATTERN = /^eip155:([^/]+)\/erc20:(0x[0-9a-fA-F]{40})$/u;

export type AccountsApiBalanceRow = {
  accountId: string;
  assetId: string;
  balance: string;
  object?: string;
};

/**
 * Checksum the address inside an EVM ERC-20 CAIP-19 id.
 * Other asset ids are returned unchanged.
 *
 * @param assetId - CAIP-19 asset id from a mock row or query param.
 * @returns The same id, with an ERC-20 address in checksum form.
 */
export function checksumErc20AssetId(assetId: string): string {
  const match = ERC20_ASSET_ID_PATTERN.exec(assetId);
  if (!match) {
    return assetId;
  }
  return `eip155:${match[1]}/erc20:${toChecksumHexAddress(match[2])}`;
}

function readCsvSearchParam(requestUrl: string, name: string): string[] {
  try {
    return (new URL(requestUrl).searchParams.get(name) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function accountChainId(accountId: string): string | undefined {
  const parts = accountId.split(':');
  if (parts.length < 3) {
    return undefined;
  }
  return `${parts[0]}:${parts[1]}`;
}

/**
 * Apply the Accounts API v6 balances contract to mock rows.
 *
 * ERC-20 asset ids are checksummed, `excludeAssetIds` rows are dropped, and
 * each `includeAssetIds` entry on a requested account's chain is present
 * (existing balance, or zero when the mock has no value). Rows without
 * `object` are marked `token`.
 *
 * @param requestUrl - The mocked request URL, including query params.
 * @param balances - Balance rows the mock would otherwise return.
 * @returns Rows safe to send as a v6 `balances` array.
 */
export function shapeV6AccountsApiBalances(
  requestUrl: string,
  balances: AccountsApiBalanceRow[],
): AccountsApiBalanceRow[] {
  const excludeAssetIds = new Set(
    readCsvSearchParam(requestUrl, 'excludeAssetIds').map((assetId) =>
      checksumErc20AssetId(assetId).toLowerCase(),
    ),
  );
  const rows: AccountsApiBalanceRow[] = [];
  const present = new Set<string>();

  for (const row of balances) {
    const assetId = checksumErc20AssetId(row.assetId);
    if (excludeAssetIds.has(assetId.toLowerCase())) {
      continue;
    }
    rows.push({
      ...row,
      assetId,
      object: row.object ?? 'token',
    });
    present.add(`${row.accountId}|${assetId.toLowerCase()}`);
  }

  for (const accountId of readCsvSearchParam(requestUrl, 'accountIds')) {
    const chainId = accountChainId(accountId);
    if (!chainId) {
      continue;
    }
    for (const requestedAssetId of readCsvSearchParam(
      requestUrl,
      'includeAssetIds',
    )) {
      const assetId = checksumErc20AssetId(requestedAssetId);
      if (excludeAssetIds.has(assetId.toLowerCase())) {
        continue;
      }
      if (assetId.split('/')[0] !== chainId) {
        continue;
      }
      const key = `${accountId}|${assetId.toLowerCase()}`;
      if (present.has(key)) {
        continue;
      }
      present.add(key);
      rows.push({
        accountId,
        assetId,
        balance: '0',
        object: 'token',
      });
    }
  }

  return rows;
}

/**
 * Build the JSON body for a mocked v6 multi-account balances response.
 *
 * @param requestUrl - The mocked request URL, including query params.
 * @param balances - Balance rows the mock would otherwise return.
 * @returns The v6 response body.
 */
export function v6AccountsApiBalancesJson(
  requestUrl: string,
  balances: AccountsApiBalanceRow[],
): {
  count: number;
  balances: AccountsApiBalanceRow[];
  unprocessedNetworks: string[];
  unprocessedIncludeAssetIds: string[];
} {
  const shaped = shapeV6AccountsApiBalances(requestUrl, balances);
  return {
    count: shaped.length,
    balances: shaped,
    unprocessedNetworks: [],
    unprocessedIncludeAssetIds: [],
  };
}
