import { Address, Keypair, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { MockedEndpoint, Mockttp } from 'mockttp';
import {
  DEFAULT_STELLAR_ADDRESS,
  EXPECTED_STELLAR_ADDRESSES_BY_INDEX,
} from '../../../constants';
import { getProductionRemoteFlagApiResponse } from '../../../feature-flags';
import { stellarTokensApiResponse } from './tokens-api';

export const STELLAR_CHAIN_ID = 'stellar:pubnet';

/** Native XLM asset id used by MultichainAssets / price APIs. */
export const STELLAR_NATIVE_ASSET_ID = `${STELLAR_CHAIN_ID}/slip44:148`;

/** Classic USDC trustline (Circle issuer on pubnet). */
export const STELLAR_USDC_ASSET_ID = `${STELLAR_CHAIN_ID}/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`;
export const STELLAR_USDC_ISSUER =
  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
export const STELLAR_USDC_TOKEN_NAME = 'USDC';
/** Horizon / UI display balance for funded USDC trustline. */
export const STELLAR_USDC_BALANCE = '25';

/** Classic EURC trustline (Circle issuer on pubnet) — activated, zero balance. */
export const STELLAR_EURC_ASSET_ID = `${STELLAR_CHAIN_ID}/asset:EURC-GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2`;
export const STELLAR_EURC_ISSUER =
  'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2';
export const STELLAR_EURC_TOKEN_NAME = 'EURC';
export const STELLAR_EURC_BALANCE = '0';

/** SEP-41 SolvBTC contract on pubnet. */
export const STELLAR_SOLVBTC_CONTRACT =
  'CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN';
export const STELLAR_SOLVBTC_ASSET_ID = `${STELLAR_CHAIN_ID}/sep41:${STELLAR_SOLVBTC_CONTRACT}`;
/** Tokens API / UI display name for SOLVBTC. */
export const STELLAR_SOLVBTC_TOKEN_NAME = 'Solv Protocol BTC';
export const STELLAR_SOLVBTC_TOKEN_SYMBOL = 'SOLVBTC';
/**
 * SOLVBTC balance in smallest units (8 decimals). `100000000` → display `1`.
 */
export const STELLAR_SOLVBTC_BALANCE_SMALLEST = 100_000_000n;
export const STELLAR_SOLVBTC_BALANCE_DISPLAY = '1';

/**
 * Classic AUDD trustline — imported by the user, not activated on Horizon
 * (no trustline / no limit metadata → activate card).
 */
export const STELLAR_AUDD_ASSET_ID = `${STELLAR_CHAIN_ID}/asset:AUDD-GDC7X2MXTYSAKUUGAIQ7J7RPEIM7GXSAIWFYWWH4GLNFECQVJJLB2EEU`;
export const STELLAR_AUDD_ISSUER =
  'GDC7X2MXTYSAKUUGAIQ7J7RPEIM7GXSAIWFYWWH4GLNFECQVJJLB2EEU';
export const STELLAR_AUDD_TOKEN_NAME = 'AUDD';
export const STELLAR_AUDD_TOKEN_SYMBOL = 'AUDD';
export const STELLAR_AUDD_DECIMALS = 7;

/**
 * Stellar stroops per XLM (1 XLM = 10_000_000 stroops).
 * Horizon balances are returned as decimal XLM strings, not stroops.
 */
export const STROOPS_PER_XLM = 10_000_000;

/**
 * Protocol base reserve for an empty account (`subentry_count` 0):
 * `(2 + 0) × 0.5 XLM = 1 XLM`. Used by assets E2E spendable-balance assertions.
 */
export const STELLAR_BASE_RESERVE_XLM = '1';

/** Default funded native balance for Stellar assets E2E (Horizon decimal XLM). */
export const STELLAR_FUNDED_XLM_BALANCE = '10';

/**
 * Spendable XLM after base reserve for {@link STELLAR_FUNDED_XLM_BALANCE}
 * (`10 − 1 = 9`).
 */
export const STELLAR_FUNDED_XLM_SPENDABLE = '9';

/**
 * With USDC + EURC trustlines (`subentry_count` 2): `(2 + 2) × 0.5 = 2 XLM`.
 */
export const STELLAR_PORTFOLIO_BASE_RESERVE_XLM = '2';

/**
 * Spendable XLM for the portfolio fixture (`10 − 2 = 8`).
 */
export const STELLAR_PORTFOLIO_XLM_SPENDABLE = '8';

export const STELLAR_NATIVE_TOKEN_NAME = 'XLM';
export const STELLAR_NATIVE_TOKEN_SYMBOL = 'XLM';

/** Default Horizon trustline limit (max int64 / 10^7). */
export const STELLAR_DEFAULT_TRUSTLINE_LIMIT = '922337203685.4775807';

export type StellarClassicTrustlineBalance = {
  assetCode: string;
  assetIssuer: string;
  balance: string;
  limit?: string;
};

export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

/**
 * Infura Stellar Soroban RPC (any project id). BIP44 `discover` calls
 * `NetworkService.getAccount` → RPC `getLedgerEntries`, not Horizon.
 */
const STELLAR_RPC_URL =
  /^https:\/\/stellar-mainnet\.infura\.io\/v3\/[^/]+$/u;

/**
 * Infura Stellar Horizon base (any project id). Used for balances / history
 * after an account exists — separate from RPC discovery.
 */
const STELLAR_HORIZON_BASE_URL =
  'https://stellar-mainnet\\.infura\\.io/v3/[^/]+/horizon';

/**
 * Remote flags required for Stellar BIP44 Stage 2 account derivation.
 * `stellarAccounts` is off in production defaults, so E2E must enable it.
 */
export const STELLAR_BIP44_FLAGS = {
  enableMultichainAccountsState2: {
    enabled: true,
    featureVersion: '2',
    minimumVersion: '12.19.0',
  },
  stellarAccounts: {
    enabled: true,
    minimumVersion: '0.0.1',
  },
};

/** Runtime override so `stellarAccounts` survives client-config refresh in E2E. */
export const STELLAR_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    stellarAccounts: STELLAR_BIP44_FLAGS.stellarAccounts,
  },
} as const;

function stellarHorizonUrl(path: string): RegExp {
  return new RegExp(`^${STELLAR_HORIZON_BASE_URL}${path}($|\\?)`, 'u');
}

type StellarJsonRpcRequest = {
  id?: number | string;
  method?: string;
  params?: { keys?: string[]; transaction?: string };
};

/**
 * Reads MultiCall `exec` invocation contract ids from a Soroban simulate tx.
 * Used so SEP-41 balance mocks stay aligned with whatever token list order the
 * snap batches, rather than hard-coding vector indexes.
 *
 * @param transactionXdr - Base64 TransactionEnvelope from `simulateTransaction`
 * @returns Contract ids in multicall order (empty when the op is not MultiCall)
 */
export function extractMulticallBalanceContractIds(
  transactionXdr: string,
): string[] {
  try {
    const envelope = xdr.TransactionEnvelope.fromXDR(transactionXdr, 'base64');
    const tx =
      envelope.switch().name === 'envelopeTypeTx'
        ? envelope.v1().tx()
        : envelope.v0().tx();
    const op = tx.operations()[0]?.body();
    if (!op || op.switch().name !== 'invokeHostFunction') {
      return [];
    }
    const hostFn = op.invokeHostFunctionOp().hostFunction();
    if (hostFn.switch().name !== 'hostFunctionTypeInvokeContract') {
      return [];
    }
    const args = hostFn.invokeContract().args();
    // MultiCall.exec(caller, invocations[])
    const invocations = args[1]?.vec();
    if (!invocations) {
      return [];
    }
    return invocations.map((invocation) => {
      const parts = invocation.vec();
      return Address.fromScVal(parts[0]).toString();
    });
  } catch {
    return [];
  }
}

/**
 * Builds a successful Soroban `simulateTransaction` result whose retval is the
 * MultiCall balance vector (bigint cells + `{}` for failed / empty cells).
 *
 * @param cells - Native values `scValToNative` will decode for each invocation
 */
export function createSimulateTransactionSuccessResponse(cells: unknown[]) {
  const retvalXdr = nativeToScVal(cells).toXDR('base64');
  return {
    transactionData: '',
    events: [] as string[],
    minResourceFee: '0',
    results: [{ auth: [] as string[], xdr: retvalXdr }],
    cost: { cpuInsns: '0', memBytes: '0' },
    latestLedger: 1,
  };
}

/**
 * Builds the LedgerKey + LedgerEntryData XDRs the Soroban RPC SDK expects for
 * an activated account (sequence-only; balances still come from Horizon).
 *
 * @param address - Stellar G… address
 * @param options - Optional sequence number
 * @param options.sequence
 */
export function createAccountLedgerEntryXdrs(
  address: string,
  options: { sequence?: string } = {},
): { key: string; xdr: string } {
  const sequence = options.sequence ?? '1';
  const accountId = Keypair.fromPublicKey(address).xdrAccountId();
  const accountEntry = new xdr.AccountEntry({
    accountId,
    balance: xdr.Int64.fromString(String(STROOPS_PER_XLM)),
    seqNum: xdr.SequenceNumber.fromString(sequence),
    numSubEntries: 0,
    inflationDest: undefined,
    flags: 0,
    homeDomain: '',
    thresholds: Buffer.from([1, 0, 0, 0]),
    signers: [],
    ext: new xdr.AccountEntryExt(0),
  });
  const ledgerKey = xdr.LedgerKey.account(
    new xdr.LedgerKeyAccount({
      accountId: Keypair.fromPublicKey(address).xdrPublicKey(),
    }),
  );

  return {
    key: ledgerKey.toXDR('base64'),
    xdr: xdr.LedgerEntryData.account(accountEntry).toXDR('base64'),
  };
}

/**
 * Mocks Infura Soroban RPC. Discovery uses `getLedgerEntries` for account
 * activation; empty `entries` → snap treats the account as not activated.
 * SEP-41 balances use MultiCall → `simulateTransaction` (optional map).
 *
 * @param mockServer - Mockttp server
 * @param fundedAddresses - Addresses that should appear activated on-chain
 * @param options - Optional SEP-41 balances keyed by contract id (`C…`)
 * @param options.sep41BalancesByContractId
 * @param options.sendTransactionHash
 * @param options.onSendTransaction
 */
export async function mockStellarRpc(
  mockServer: Mockttp,
  fundedAddresses: readonly string[] = [],
  options: {
    sep41BalancesByContractId?: Readonly<Record<string, bigint>>;
    /**
     * When set, `sendTransaction` returns PENDING with this hash and invokes
     * `onSendTransaction` (used to flip Horizon trustline state after submit).
     */
    sendTransactionHash?: string;
    onSendTransaction?: () => void;
  } = {},
): Promise<MockedEndpoint> {
  const fundedEntriesByKey = new Map(
    fundedAddresses.map((address) => {
      const entry = createAccountLedgerEntryXdrs(address);
      return [entry.key, entry.xdr] as const;
    }),
  );
  const sep41BalancesByContractId = options.sep41BalancesByContractId ?? {};
  const {sendTransactionHash} = options;
  const {onSendTransaction} = options;

  return mockServer
    .forPost(STELLAR_RPC_URL)
    .always()
    .thenCallback(async (request) => {
      const body = (await request.body.getJson()) as StellarJsonRpcRequest;
      const id = body?.id ?? 1;

      if (body?.method === 'getHealth') {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id,
            result: { status: 'healthy' },
          },
        };
      }

      if (body?.method === 'getLedgerEntries') {
        const keys = body.params?.keys ?? [];
        const entries = keys.flatMap((key) => {
          const entryXdr = fundedEntriesByKey.get(key);
          if (!entryXdr) {
            return [];
          }
          return [
            {
              key,
              xdr: entryXdr,
              lastModifiedLedgerSeq: 1,
            },
          ];
        });

        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id,
            result: {
              entries,
              latestLedger: 1,
            },
          },
        };
      }

      if (body?.method === 'simulateTransaction') {
        const contractIds = body.params?.transaction
          ? extractMulticallBalanceContractIds(body.params.transaction)
          : [];
        const cells = contractIds.map((contractId) => {
          const balance = sep41BalancesByContractId[contractId];
          return balance === undefined ? {} : balance;
        });

        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id,
            result: createSimulateTransactionSuccessResponse(cells),
          },
        };
      }

      if (body?.method === 'sendTransaction' && sendTransactionHash) {
        onSendTransaction?.();
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id,
            result: {
              status: 'PENDING',
              hash: sendTransactionHash,
            },
          },
        };
      }

      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id,
          result: {},
        },
      };
    });
}

/**
 * Builds a Horizon account resource. Unlike Tron E2E (local node + contract
 * seeder), Stellar balances are entirely mocked here.
 *
 * @param address - Stellar account address (G…)
 * @param options - Native XLM + optional classic trustline balances
 * @param options.xlmBalance
 * @param options.classicBalances
 */
export function createHorizonAccountResponse(
  address: string,
  options: {
    xlmBalance?: string;
    classicBalances?: readonly StellarClassicTrustlineBalance[];
  } = {},
) {
  const xlmBalance = options.xlmBalance ?? '0';
  const classicBalances = options.classicBalances ?? [];
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    _links: {
      self: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}`,
      },
      transactions: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}/transactions{?cursor,limit,order}`,
        templated: true,
      },
      operations: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}/operations{?cursor,limit,order}`,
        templated: true,
      },
      payments: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}/payments{?cursor,limit,order}`,
        templated: true,
      },
      effects: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}/effects{?cursor,limit,order}`,
        templated: true,
      },
      offers: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}/offers{?cursor,limit,order}`,
        templated: true,
      },
      trades: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}/trades{?cursor,limit,order}`,
        templated: true,
      },
      data: {
        href: `https://stellar-mainnet.infura.io/v3/mock/horizon/accounts/${address}/data/{key}`,
        templated: true,
      },
    },
    id: address,
    account_id: address,
    sequence: '1',
    subentry_count: classicBalances.length,
    num_sponsoring: 0,
    num_sponsored: 0,
    balances: [
      ...classicBalances.map((trustline) => ({
        balance: trustline.balance,
        limit: trustline.limit ?? STELLAR_DEFAULT_TRUSTLINE_LIMIT,
        buying_liabilities: '0.0000000',
        selling_liabilities: '0.0000000',
        asset_type:
          trustline.assetCode.length <= 4
            ? 'credit_alphanum4'
            : 'credit_alphanum12',
        asset_code: trustline.assetCode,
        asset_issuer: trustline.assetIssuer,
        is_authorized: true,
      })),
      {
        balance: xlmBalance,
        buying_liabilities: '0.0000000',
        selling_liabilities: '0.0000000',
        asset_type: 'native',
      },
    ],
    flags: {
      auth_required: false,
      auth_revocable: false,
      auth_immutable: false,
      auth_clawback_enabled: false,
    },
    signers: [
      {
        weight: 1,
        key: address,
        type: 'ed25519_public_key',
      },
    ],
    thresholds: {
      low_threshold: 0,
      med_threshold: 0,
      high_threshold: 0,
    },
  };
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * Mocks client-config so Stellar stays enabled after remote flag refresh.
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarFeatureFlags(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  // `.always()` so this wins over mock-e2e's production client-config rule.
  // Without it, mockttp prefers the last matching non-always rule and
  // `stellarAccounts` stays production-default (disabled) — discovery never runs.
  return mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        ...getProductionRemoteFlagApiResponse(),
        STELLAR_BIP44_FLAGS,
        { corePlatformRpcFailoverMode: 'disabled' },
      ],
    }));
}

/**
 * Horizon 404 body for a missing account (triggers Stellar SDK `NotFoundError`).
 * Discovery treats this as "no activity" and stops creating further HD groups.
 *
 * @param address - Address that was requested
 */
export function createHorizonAccountNotFoundResponse(address: string) {
  return {
    type: 'https://stellar.org/horizon-errors/not_found',
    title: 'Resource Missing',
    status: 404,
    detail: `The resource at the url requested was not found. Account not found: ${address}`,
  };
}

/**
 * Mocks Horizon `GET /accounts/:address` for one account.
 *
 * @param mockServer - Mockttp server
 * @param address - Stellar address to serve
 * @param options - Native + classic trustline balances
 * @param options.xlmBalance
 * @param options.classicBalances
 * @param options.getClassicBalances
 */
export async function mockHorizonAccount(
  mockServer: Mockttp,
  address: string = DEFAULT_STELLAR_ADDRESS,
  options: {
    xlmBalance?: string;
    classicBalances?: readonly StellarClassicTrustlineBalance[];
    /**
     * When set, classic trustlines are resolved per request so activate E2E
     * can add a trustline after `sendTransaction`.
     */
    getClassicBalances?: () => readonly StellarClassicTrustlineBalance[];
  } = {},
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(stellarHorizonUrl(`/accounts/${address}`))
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: createHorizonAccountResponse(address, {
        xlmBalance: options.xlmBalance,
        classicBalances:
          options.getClassicBalances?.() ?? options.classicBalances,
      }),
    }));
}

/**
 * Mocks Horizon `GET /accounts/:address` as not found (404).
 *
 * @param mockServer - Mockttp server
 * @param address - Stellar address that should not exist on-chain
 */
export async function mockHorizonAccountNotFound(
  mockServer: Mockttp,
  address: string,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(stellarHorizonUrl(`/accounts/${address}`))
    .always()
    .thenCallback(() => ({
      statusCode: 404,
      json: createHorizonAccountNotFoundResponse(address),
    }));
}

/**
 * Catch-all Horizon account 404 for any G… address not matched by a prior
 * specific mock. Register funded-account mocks first — mockttp uses the first
 * matching `.always()` rule.
 *
 * @param mockServer - Mockttp server
 */
export async function mockHorizonUnknownAccountsNotFound(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(stellarHorizonUrl(`/accounts/G[A-Z0-9]+`))
    .always()
    .thenCallback((request) => {
      const address =
        request.url.split('/accounts/')[1]?.split('?')[0] ?? 'unknown';
      return {
        statusCode: 404,
        json: createHorizonAccountNotFoundResponse(address),
      };
    });
}

/**
 * Mocks Horizon account collection endpoints the snap may hit after selecting
 * Stellar (transactions / payments / operations). Returns empty pages.
 *
 * @param mockServer - Mockttp server
 * @param address - Stellar address
 */
export async function mockHorizonAccountHistory(
  mockServer: Mockttp,
  address: string = DEFAULT_STELLAR_ADDRESS,
): Promise<MockedEndpoint[]> {
  const emptyPage = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: {
      self: { href: '' },
      next: { href: '' },
      prev: { href: '' },
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: { records: [] },
  };

  const paths = ['transactions', 'payments', 'operations'] as const;
  return Promise.all(
    paths.map((suffix) =>
      mockServer
        .forGet(stellarHorizonUrl(`/accounts/${address}/${suffix}`))
        .always()
        .thenJson(200, emptyPage),
    ),
  );
}

/**
 * Default mocks for Stellar derivation E2E: feature flags + RPC + Horizon for
 * HD accounts 1-8. No local node / contract seeder.
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarAccountDerivationMocks(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const endpoints: MockedEndpoint[] = [
    await mockStellarFeatureFlags(mockServer),
    await mockStellarRpc(mockServer, EXPECTED_STELLAR_ADDRESSES_BY_INDEX),
  ];

  for (const address of EXPECTED_STELLAR_ADDRESSES_BY_INDEX) {
    endpoints.push(
      await mockHorizonAccount(mockServer, address, { xlmBalance: '0' }),
      ...(await mockHorizonAccountHistory(mockServer, address)),
    );
  }

  return endpoints;
}

/**
 * Mocks Stellar BIP44 discovery: HD indices `0..throughAccountCount-1` are
 * activated on Soroban RPC (`getLedgerEntries`) and funded on Horizon; higher
 * indexes return empty RPC entries / Horizon 404 so discovery stops.
 *
 * Discovery activation is RPC-only (`isAccountActivated` → `getAccount`);
 * Horizon is still mocked for post-create balance/history sync.
 *
 * @param mockServer - Mockttp server
 * @param options - `throughAccountCount` defaults to 5 (Accounts 1-5; Account 6 absent)
 * @param options.throughAccountCount
 * @param options.xlmBalance
 */
export async function mockStellarAccountDiscoveryMocks(
  mockServer: Mockttp,
  options: { throughAccountCount?: number; xlmBalance?: string } = {},
): Promise<MockedEndpoint[]> {
  const throughAccountCount = options.throughAccountCount ?? 5;
  const xlmBalance = options.xlmBalance ?? '10';

  const fundedAddresses = EXPECTED_STELLAR_ADDRESSES_BY_INDEX.slice(
    0,
    throughAccountCount,
  );

  const endpoints: MockedEndpoint[] = [
    await mockStellarFeatureFlags(mockServer),
    // Empty ledger entries for non-funded keys → snap "Account not found"
    await mockStellarRpc(mockServer, fundedAddresses),
  ];

  for (const address of fundedAddresses) {
    endpoints.push(
      await mockHorizonAccount(mockServer, address, { xlmBalance }),
      ...(await mockHorizonAccountHistory(mockServer, address)),
    );
  }

  const nextIndex = throughAccountCount;
  if (nextIndex < EXPECTED_STELLAR_ADDRESSES_BY_INDEX.length) {
    endpoints.push(
      await mockHorizonAccountNotFound(
        mockServer,
        EXPECTED_STELLAR_ADDRESSES_BY_INDEX[nextIndex],
      ),
    );
  }

  endpoints.push(await mockHorizonUnknownAccountsNotFound(mockServer));

  return endpoints;
}

/**
 * Mocks Tokens API `GET /v3/assets` (by asset id). With `assetsUnifyState`, the
 * extension hydrates `assetsInfo` from this endpoint — without rows for classic /
 * SEP-41 ids those balances stay invisible in the token list even when the snap
 * already synced them. Also keeps common EVM natives for mixed requests.
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarNativeTokenMetadata(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  const stellarMetadataByAssetId = new Map(
    stellarTokensApiResponse.data.map((asset) => [asset.assetId, asset]),
  );

  return mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const assetIdsParam = url.searchParams.getAll('assetIds').join(',');
      const requestedAssetIds = assetIdsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      const results: {
        assetId: string;
        name: string;
        symbol: string;
        decimals: number;
        iconUrl?: string;
      }[] = [];

      for (const assetId of requestedAssetIds) {
        const stellarAsset = stellarMetadataByAssetId.get(assetId);
        if (stellarAsset) {
          results.push({
            assetId: stellarAsset.assetId,
            name: stellarAsset.name,
            symbol: stellarAsset.symbol,
            decimals: stellarAsset.decimals,
            iconUrl: stellarAsset.iconUrl,
          });
          continue;
        }

        if (assetId === 'eip155:1/slip44:60') {
          results.push({
            assetId: 'eip155:1/slip44:60',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          });
        } else if (
          assetId === 'eip155:1337/slip44:1' ||
          assetId === 'eip155:1337/slip44:60'
        ) {
          results.push({
            assetId: 'eip155:1337/slip44:1',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          });
        }
      }

      return { statusCode: 200, json: results };
    });
}

/**
 * Mocks Tokens API `GET /v3/chains/stellar:pubnet/assets` — the snap's
 * AssetMetadataService sync source for classic + SEP-41 catalogs.
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarTokensApiByChainId(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(
      `https://tokens.api.cx.metamask.io/v3/chains/${STELLAR_CHAIN_ID}/assets`,
    )
    .always()
    .thenJson(200, stellarTokensApiResponse);
}

/**
 * Mocks Token Search API so manual import can find Stellar catalog tokens
 * (e.g. AUDD) from Manage tokens / token search.
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarTokenSearch(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/^https:\/\/token\.api\.cx\.metamask\.io\/tokens\/search/u)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const query = (url.searchParams.get('query') ?? '').trim().toLowerCase();
      const data = query
        ? stellarTokensApiResponse.data.filter(
            (asset) =>
              asset.symbol.toLowerCase() === query ||
              asset.name.toLowerCase() === query,
          )
        : [];

      return {
        statusCode: 200,
        json: {
          data,
          count: data.length,
          totalCount: data.length,
          pageInfo: { hasNextPage: false, endCursor: '' },
        },
      };
    });
}

/**
 * Mocks Price API historical charts for Stellar CAIP asset ids so asset
 * details does not fail JSON parsing on empty unmatched responses.
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarHistoricalPrices(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(
      /^https:\/\/price\.api\.cx\.metamask\.io\/v3\/historical-prices\/stellar:/u,
    )
    .always()
    .thenJson(200, {
      prices: [
        [1_700_000_000_000, 1],
        [1_700_000_360_000, 1.01],
      ],
      marketCaps: [],
      totalVolumes: [],
    });
}

/**
 * Default classic trustlines for the multi-asset portfolio E2E:
 * USDC funded, EURC activated at zero.
 */
export const STELLAR_PORTFOLIO_CLASSIC_BALANCES: readonly StellarClassicTrustlineBalance[] =
  [
    {
      assetCode: 'USDC',
      assetIssuer: STELLAR_USDC_ISSUER,
      balance: STELLAR_USDC_BALANCE,
    },
    {
      assetCode: 'EURC',
      assetIssuer: STELLAR_EURC_ISSUER,
      balance: STELLAR_EURC_BALANCE,
    },
  ];

/**
 * Mocks for Stellar assets E2E: flags + Tokens API (by-id + by-chain + search)
 * + historical prices + RPC activation / MultiCall SEP-41 balances + Horizon
 * classic + native.
 *
 * @param mockServer - Mockttp server
 * @param options - Portfolio balances; omit classic/SEP-41 for XLM-only cases
 * @param options.xlmBalance
 * @param options.classicBalances
 * @param options.sep41BalancesByContractId
 */
export async function mockStellarAssetsMocks(
  mockServer: Mockttp,
  options: {
    xlmBalance?: string;
    classicBalances?: readonly StellarClassicTrustlineBalance[];
    sep41BalancesByContractId?: Readonly<Record<string, bigint>>;
  } = {},
): Promise<MockedEndpoint[]> {
  const xlmBalance = options.xlmBalance ?? STELLAR_FUNDED_XLM_BALANCE;
  return [
    await mockStellarFeatureFlags(mockServer),
    await mockStellarNativeTokenMetadata(mockServer),
    await mockStellarTokensApiByChainId(mockServer),
    await mockStellarTokenSearch(mockServer),
    await mockStellarHistoricalPrices(mockServer),
    await mockStellarRpc(mockServer, [DEFAULT_STELLAR_ADDRESS], {
      sep41BalancesByContractId: options.sep41BalancesByContractId,
    }),
    await mockHorizonAccount(mockServer, DEFAULT_STELLAR_ADDRESS, {
      xlmBalance,
      classicBalances: options.classicBalances,
    }),
    ...(await mockHorizonAccountHistory(mockServer, DEFAULT_STELLAR_ADDRESS)),
  ];
}

/** Fixed hash returned by mocked RPC `sendTransaction` for activate E2E. */
export const STELLAR_MOCK_CHANGE_TRUST_TX_HASH =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

/**
 * Horizon fee_stats for `Server.fetchBaseFee` (change-trust inclusion fee).
 *
 * @param mockServer - Mockttp server
 */
export async function mockHorizonFeeStats(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  /* eslint-disable @typescript-eslint/naming-convention */
  return mockServer
    .forGet(stellarHorizonUrl('/fee_stats'))
    .always()
    .thenJson(200, {
      last_ledger: 1,
      last_ledger_base_fee: '100',
      ledger_capacity_usage: '0.1',
      fee_charged: {
        max: '100',
        min: '100',
        mode: '100',
        p10: '100',
        p20: '100',
        p30: '100',
        p40: '100',
        p50: '100',
        p60: '100',
        p70: '100',
        p80: '100',
        p90: '100',
        p95: '100',
        p99: '100',
      },
      max_fee: {
        max: '100',
        min: '100',
        mode: '100',
        p10: '100',
        p20: '100',
        p30: '100',
        p40: '100',
        p50: '100',
        p60: '100',
        p70: '100',
        p80: '100',
        p90: '100',
        p95: '100',
        p99: '100',
      },
    });
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * Horizon `GET /transactions/:hash` for trackTransaction polling after submit.
 *
 * @param mockServer - Mockttp server
 * @param transactionHash - Hash returned by mocked `sendTransaction`
 */
export async function mockHorizonTransaction(
  mockServer: Mockttp,
  transactionHash: string = STELLAR_MOCK_CHANGE_TRUST_TX_HASH,
): Promise<MockedEndpoint> {
  /* eslint-disable @typescript-eslint/naming-convention */
  return mockServer
    .forGet(stellarHorizonUrl(`/transactions/${transactionHash}`))
    .always()
    .thenJson(200, {
      _links: {
        self: { href: '' },
        account: { href: '' },
        ledger: { href: '' },
        operations: { href: '', templated: true },
        effects: { href: '', templated: true },
        precedes: { href: '' },
        succeeds: { href: '' },
        transaction: { href: '' },
      },
      id: transactionHash,
      paging_token: '1',
      successful: true,
      hash: transactionHash,
      ledger: 1,
      created_at: '2026-01-01T00:00:00Z',
      source_account: DEFAULT_STELLAR_ADDRESS,
      source_account_sequence: '1',
      fee_account: DEFAULT_STELLAR_ADDRESS,
      fee_charged: '100',
      max_fee: '100',
      operation_count: 1,
      // Minimal payment envelope XDR — parseable by Transaction.fromHorizon.
      envelope_xdr:
        'AAAAAgAAAAB3r4GKMkdyMhEmYxrb+PKIqz3WmlQhYpBX1KvVgptyRwAAAGQDvuslAAAABAAAAAAAAAAAAAAAAQAAAAAAAAACAAAAAAAAAAAAHoSAAAAAAD9BNkCUnPhicTJ00X5jDK52WV5J5fA719ZgBEJTD0i2AAAAAUFRVUEAAAAAW5QuU6wzyP0KgMx8GxqF19g4qcQZd6rRizrwV/jjPfAAAAAAO5rKAAAAAAAAAAAAAAAAAYKbckcAAABAFrkTeIpg9s/5TuXb0qMDLDWLOG0+BpxGaHEkWl394umLP6jvfFvwUQm4waUUrRxZO9juE6/FtJXHhI6coN7vAg==',
      result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAACAAAAAAAAAAA=',
      fee_meta_xdr: 'AAAAAA==',
      memo_type: 'none',
      signatures: [
        'FrkTeIpg9s/5TuXb0qMDLDWLOG0+BpxGaHEkWl394umLP6jvfFvwUQm4waUUrRxZO9juE6/FtJXHhI6coN7vAg==',
      ],
    });
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * Security Alerts API scan for change-trust confirmation (`securityScanning: true`).
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarSecurityScan(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost('https://security-alerts.api.cx.metamask.io/stellar/transaction/scan')
    .always()
    .thenJson(200, {
      validation: {
        status: 'Success',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: 'Benign',
        description: '',
        reason: '',
        classification: '',
        features: [],
      },
      simulation: {
        status: 'Success',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_summary: {},
      },
    });
}

/**
 * Spot prices for confirmation fee row (`loadPrice: true`).
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarSpotPrices(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        [STELLAR_NATIVE_ASSET_ID]: {
          id: STELLAR_NATIVE_ASSET_ID,
          price: 0.1,
          marketCap: 0,
          allTimeHigh: 0,
          allTimeLow: 0,
          totalVolume: 0,
          high1d: 0,
          low1d: 0,
          circulatingSupply: 0,
          dilutedMarketCap: 0,
          marketCapPercentChange1d: 0,
          priceChange1d: 0,
          pricePercentChange1d: 0,
          pricePercentChange1h: 0,
          pricePercentChange7d: 0,
          pricePercentChange14d: 0,
          pricePercentChange30d: 0,
          pricePercentChange200d: 0,
          pricePercentChange1y: 0,
        },
      },
    }));
}

/**
 * Mocks for activate-imported-trustline E2E: catalog + search + fee_stats +
 * security scan + spot prices + RPC submit + Horizon account that gains AUDD
 * after send + Horizon transaction for trackTransaction.
 *
 * @param mockServer - Mockttp server
 */
export async function mockStellarActivateTrustlineMocks(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  let trustlineActivated = false;
  const txHash = STELLAR_MOCK_CHANGE_TRUST_TX_HASH;

  const getClassicBalances = (): StellarClassicTrustlineBalance[] => {
    // USDC is always present with a non-zero balance (deactivate must fail).
    const balances: StellarClassicTrustlineBalance[] = [
      {
        assetCode: STELLAR_USDC_TOKEN_NAME,
        assetIssuer: STELLAR_USDC_ISSUER,
        balance: STELLAR_USDC_BALANCE,
      },
    ];
    if (trustlineActivated) {
      balances.push({
        assetCode: STELLAR_AUDD_TOKEN_NAME,
        assetIssuer: STELLAR_AUDD_ISSUER,
        balance: '0',
      });
    }
    return balances;
  };

  return [
    await mockStellarFeatureFlags(mockServer),
    await mockStellarNativeTokenMetadata(mockServer),
    await mockStellarTokensApiByChainId(mockServer),
    await mockStellarTokenSearch(mockServer),
    await mockStellarHistoricalPrices(mockServer),
    await mockStellarSpotPrices(mockServer),
    await mockStellarSecurityScan(mockServer),
    await mockHorizonFeeStats(mockServer),
    await mockHorizonTransaction(mockServer, txHash),
    await mockStellarRpc(mockServer, [DEFAULT_STELLAR_ADDRESS], {
      sendTransactionHash: txHash,
      // Activate then deactivate: each submit flips Horizon trustline presence.
      onSendTransaction: () => {
        trustlineActivated = !trustlineActivated;
      },
    }),
    await mockHorizonAccount(mockServer, DEFAULT_STELLAR_ADDRESS, {
      xlmBalance: STELLAR_FUNDED_XLM_BALANCE,
      getClassicBalances,
    }),
    ...(await mockHorizonAccountHistory(mockServer, DEFAULT_STELLAR_ADDRESS)),
  ];
}
