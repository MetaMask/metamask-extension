/* eslint-disable @typescript-eslint/naming-convention */
import { MockedEndpoint, Mockttp } from 'mockttp';
import {
  Networks,
  TransactionBuilder,
  type Horizon,
} from '@stellar/stellar-sdk';

/**
 * Mutable store of Horizon records produced by mocked Soroban RPC submits.
 * Shared across RPC, per-hash Horizon lookups, and account transaction lists.
 */
export type StellarSubmittedTxStore = {
  byHash: Map<string, Horizon.ServerApi.TransactionRecord>;
};

/**
 * Creates an empty submitted-transaction store for Stellar Send E2E mocks.
 */
export function createStellarSubmittedTxStore(): StellarSubmittedTxStore {
  return { byHash: new Map() };
}

const HORIZON_BASE_RE =
  '(?:^https:\\/\\/(?:horizon\\.stellar\\.org|stellar-(?:mainnet|testnet)\\.infura\\.io\\/v3\\/[^/?#]+\\/horizon)|(?:^|\\/)horizon)';

const HORIZON_FEE_STATS_RE = new RegExp(
  `${HORIZON_BASE_RE}\\/fee_stats\\/?(?:[?#].*)?$`,
  'iu',
);

const HORIZON_TX_BY_HASH_RE = new RegExp(
  `${HORIZON_BASE_RE}\\/transactions\\/([a-fA-F0-9]{64})\\/?(?:[?#].*)?$`,
  'iu',
);

const STELLAR_RPC_RE =
  /^https:\/\/stellar-(?:mainnet|testnet)\.infura\.io\/v3\/[^/?#]+\/?(?:[?#].*)?$/iu;

function horizonRecordFromSignedXdr(
  envelopeXdr: string,
): Horizon.ServerApi.TransactionRecord {
  const parsed = TransactionBuilder.fromXDR(envelopeXdr, Networks.PUBLIC);
  const built =
    'innerTransaction' in parsed ? parsed.innerTransaction : parsed;
  const hash = built.hash().toString('hex');
  const createdAt = new Date().toISOString();

  return {
    id: hash,
    hash,
    paging_token: String(Date.now()),
    successful: true,
    ledger: 42_000_001,
    created_at: createdAt,
    source_account: built.source,
    source_account_sequence: String(built.sequence),
    fee_account: built.source,
    fee_charged: built.fee,
    max_fee: built.fee,
    operation_count: built.operations.length,
    envelope_xdr: envelopeXdr,
    result_xdr: '',
    result_meta_xdr: '',
    fee_meta_xdr: '',
    memo_type: 'none',
    signatures: [],
  } as Horizon.ServerApi.TransactionRecord;
}

/**
 * Mocks Horizon `/fee_stats` so inclusion-fee quotes succeed during Send.
 *
 * @param mockServer - Mockttp server.
 */
export async function mockHorizonFeeStats(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(HORIZON_FEE_STATS_RE)
    .always()
    .thenJson(200, {
      last_ledger_base_fee: '100',
      last_ledger: 1,
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
}

/**
 * Mocks Horizon `GET /transactions/{hash}` for submitted Send txs.
 *
 * Returns 404 until the matching RPC `sendTransaction` mock records the hash,
 * then 200 with the captured Horizon record (Confirmed).
 *
 * @param mockServer - Mockttp server.
 * @param store - Shared submitted-tx store.
 */
export async function mockHorizonTransactionByHash(
  mockServer: Mockttp,
  store: StellarSubmittedTxStore,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(HORIZON_TX_BY_HASH_RE)
    .always()
    .thenCallback((req) => {
      const hash = req.url.match(HORIZON_TX_BY_HASH_RE)?.[1]?.toLowerCase() ?? '';
      const record = store.byHash.get(hash);
      if (!record) {
        return {
          statusCode: 404,
          json: {
            type: 'https://stellar.org/horizon-errors/not_found',
            title: 'Resource Missing',
            status: 404,
            detail: `Transaction ${hash} not found`,
          },
        };
      }
      return { statusCode: 200, json: record };
    });
}

/**
 * Mocks Infura Stellar Soroban RPC (`sendTransaction` and related methods).
 *
 * On `sendTransaction`, decodes the signed XDR, stores a successful Horizon
 * record keyed by hash, and returns RPC `PENDING` so the snap saves Pending
 * activity immediately. TrackTransaction later resolves Confirmed via Horizon.
 *
 * @param mockServer - Mockttp server.
 * @param store - Shared submitted-tx store.
 */
export async function mockStellarRpc(
  mockServer: Mockttp,
  store: StellarSubmittedTxStore,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(STELLAR_RPC_RE)
    .always()
    .thenCallback(async (req) => {
      let body: {
        id?: string | number;
        method?: string;
        params?: { transaction?: string };
      } = {};
      try {
        body = JSON.parse((await req.body.getText()) || '{}') as typeof body;
      } catch {
        body = {};
      }

      const id = body.id ?? 1;

      if (body.method === 'sendTransaction') {
        const envelopeXdr = body.params?.transaction;
        if (!envelopeXdr || typeof envelopeXdr !== 'string') {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: 'missing transaction' },
            },
          };
        }

        const record = horizonRecordFromSignedXdr(envelopeXdr);
        store.byHash.set(record.hash.toLowerCase(), record);

        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id,
            result: {
              status: 'PENDING',
              hash: record.hash,
              latestLedger: 42_000_001,
              latestLedgerCloseTime: '0',
            },
          },
        };
      }

      if (body.method === 'getTransaction') {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id,
            result: { status: 'SUCCESS' },
          },
        };
      }

      // getHealth / getNetwork / getLatestLedger / etc.
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
 * Registers Horizon fee + per-hash lookup + Soroban RPC mocks for Send flows.
 *
 * @param mockServer - Mockttp server.
 * @param store - Shared submitted-tx store (also wired into account tx lists).
 */
export async function mockStellarSendNetwork(
  mockServer: Mockttp,
  store: StellarSubmittedTxStore,
): Promise<MockedEndpoint[]> {
  return [
    await mockHorizonFeeStats(mockServer),
    await mockHorizonTransactionByHash(mockServer, store),
    await mockStellarRpc(mockServer, store),
  ];
}

/**
 * Returns submitted Horizon records for an account address (source match).
 *
 * @param store - Shared submitted-tx store.
 * @param address - Stellar account id.
 */
export function getSubmittedHorizonRecordsForAccount(
  store: StellarSubmittedTxStore,
  address: string,
): Horizon.ServerApi.TransactionRecord[] {
  return [...store.byHash.values()].filter(
    (record) => record.source_account === address,
  );
}
/* eslint-enable @typescript-eslint/naming-convention */
