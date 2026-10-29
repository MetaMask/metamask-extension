import type { Transaction } from '@metamask/keyring-api';
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';

/** Stable key: `{chain.namespace}:{assetReference}` for fungible token CAIP assets (matches PhishingController bulk scan grouping). */
export type MultichainTokenScanKey = `${string}:${string}`;

/**
 * Generates a cache key for token scan results
 *
 * @param chainId - The chain ID
 * @param tokenAddress - The token address
 * @returns The cache key in format "chainId:tokenAddress" (both lowercase)
 */
export function generateTokenCacheKey(
  chainId: string,
  tokenAddress: string,
): MultichainTokenScanKey {
  return `${chainId.toLowerCase()}:${tokenAddress.toLowerCase()}`;
}

function collectTokenScanKeysFromMovements(
  movements: {
    asset?:
      | {
          fungible: true;
          type: string;
        }
      | {
          fungible: false;
          id: string;
        }
      | null;
  }[],
  into: Set<MultichainTokenScanKey>,
) {
  for (const movement of movements) {
    const asset = movement?.asset;

    if (!asset || !('fungible' in asset) || !asset.fungible) {
      continue;
    }

    if (!isCaipAssetType(asset.type)) {
      continue;
    }

    const parsed = parseCaipAssetType(asset.type);
    if (parsed.assetNamespace !== 'token') {
      continue;
    }

    into.add(
      generateTokenCacheKey(
        `${parsed.chain.namespace}:${parsed.chain.reference}`,
        parsed.assetReference,
      ),
    );
  }
}

export function collectTransactionTokenScanKeys(transaction: Transaction) {
  const keys = new Set<MultichainTokenScanKey>();

  collectTokenScanKeysFromMovements(transaction.from ?? [], keys);
  collectTokenScanKeysFromMovements(transaction.to ?? [], keys);

  for (const fee of transaction.fees ?? []) {
    collectTokenScanKeysFromMovements([fee], keys);
  }

  return [...keys];
}

function transactionHasMaliciousToken(
  transaction: Transaction,
  maliciousKeys: ReadonlySet<MultichainTokenScanKey>,
) {
  return collectTransactionTokenScanKeys(transaction).some((key) =>
    maliciousKeys.has(key),
  );
}

export function filterMaliciousTransactions(
  transactions: Transaction[],
  maliciousKeys: ReadonlySet<MultichainTokenScanKey>,
) {
  return transactions.filter(
    (tx) => !transactionHasMaliciousToken(tx, maliciousKeys),
  );
}
