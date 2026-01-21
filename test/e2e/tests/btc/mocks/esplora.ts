import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * The Bitcoin address derived from E2E_SRP using BIP84 (P2WPKH).
 * This is deterministic - always the same for the test SRP.
 *
 * Address: bc1qk9u7870r6zrjr6euzkdyx5np94wkduvul0zmg7
 * ScriptPubKey: 0014b179e3f9e3d08721eb3c159a4352612d5d66f19c
 * Scripthash (SHA256): 7df1af9edc3f17e4e228fd287a14dfb79fc9f4155e2418152536cc7a3e249ba4
 */
const E2E_BTC_ADDRESS = 'bc1qk9u7870r6zrjr6euzkdyx5np94wkduvul0zmg7';
const E2E_BTC_SCRIPTPUBKEY = '0014b179e3f9e3d08721eb3c159a4352612d5d66f19c';
const E2E_BTC_SCRIPTHASH =
  '7df1af9edc3f17e4e228fd287a14dfb79fc9f4155e2418152536cc7a3e249ba4';

const FUNDING_TX_ID =
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
const FUNDING_BLOCK_HEIGHT = 932935;
const FUNDING_BLOCK_HASH =
  '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

/**
 * Funding transaction that sends DEFAULT_BTC_BALANCE to the E2E test address.
 * The scriptPubKey matches the derived address from E2E_SRP.
 *
 * This uses a native SegWit (P2WPKH) input format which is required
 * for BDK to properly process the transaction.
 */
const FUNDING_TX = {
  txid: FUNDING_TX_ID,
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: '3b40b6a568e1d9b8e8c5fd0f9c5cf8a7d6e5c4b3a2918070605040302010000f',
      vout: 1,
      prevout: {
        scriptpubkey: '0014a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: 'bc1q5xkv868t06f78yaxpu722adv2aul0gdcz3e3mw',
        value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC + 1000,
      },
      scriptsig: '',
      scriptsig_asm: '',
      witness: [
        '304402203f8c5ef4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d802201a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b01',
        '02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      ],
      is_coinbase: false,
      sequence: 4294967293,
    },
  ],
  vout: [
    {
      // Output to the E2E test address (P2WPKH)
      scriptpubkey: E2E_BTC_SCRIPTPUBKEY,
      scriptpubkey_asm: `OP_0 OP_PUSHBYTES_20 ${E2E_BTC_SCRIPTPUBKEY.slice(4)}`,
      scriptpubkey_type: 'v0_p2wpkh',
      scriptpubkey_address: E2E_BTC_ADDRESS,
      value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC, // 1 BTC = 100,000,000 sats
    },
  ],
  size: 191,
  weight: 437,
  fee: 1000,
  status: {
    confirmed: true,
    block_height: FUNDING_BLOCK_HEIGHT,
    block_hash: FUNDING_BLOCK_HASH,
    block_time: 1768824955,
  },
};

const mockBlocks = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/blocks$/u,
    )
    .always()
    .thenCallback(() => {
      console.log('[BTC MOCK] /blocks endpoint called');
      return {
        statusCode: 200,
        json: [
          {
            id: '00000000000000000001d3a19bc9dbde9d1d26b25aa49269b575282bb6d74409',
            height: 932936,
            version: 1073676288,
            timestamp: 1768825157,
            tx_count: 1104,
            size: 2006326,
            weight: 3993304,
            merkle_root:
              '68b04e69caac6a24c585e8a357fd9a5de8b084bda8b043690efaafcd11343c2a',
            previousblockhash: FUNDING_BLOCK_HASH,
            mediantime: 1768823212,
            nonce: 1426240500,
            bits: 386001906,
            difficulty: 146472570619930.78,
          },
          {
            id: FUNDING_BLOCK_HASH,
            height: FUNDING_BLOCK_HEIGHT,
            version: 536870912,
            timestamp: 1768824955,
            tx_count: 3161,
            size: 1772079,
            weight: 3993186,
            merkle_root:
              'd7ee3bf9abfd65a43de37042f52a889e68634c0332af467d90c2e1997d230888',
            previousblockhash:
              '00000000000000000000b64f4ad246c16dfcbb1e9a236639b4d1f256c9a4450c',
            mediantime: 1768823066,
            nonce: 1134465253,
            bits: 386001906,
            difficulty: 146472570619930.78,
          },
          {
            id: '00000000000000000000b64f4ad246c16dfcbb1e9a236639b4d1f256c9a4450c',
            height: 932934,
            version: 609419264,
            timestamp: 1768824375,
            tx_count: 1075,
            size: 390396,
            weight: 990633,
            merkle_root:
              'df3cf13108177ebb597b25621dee2e4f744e51431a9f8f1753426a98556adf8e',
            previousblockhash:
              '00000000000000000001c14fa551c91c6814c2af56055d59c9bbee5b18ba752f',
            mediantime: 1768822914,
            nonce: 2221686570,
            bits: 386001906,
            difficulty: 146472570619930.78,
          },
        ],
      };
    });

/**
 * Mock scripthash/{hash}/txs requests.
 *
 * Returns FUNDING_TX for the E2E test address scripthash,
 * and empty array for all other scripthashes.
 *
 * @param mockServer - The mock server instance
 */
const mockAllScriptHashTxs = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/scripthash\/[0-9a-f]{64}\/txs$/u,
    )
    .always()
    .thenCallback((request) => {
      const scripthashMatch = request.url.match(
        /scripthash\/([a-f0-9]{64})\/txs/u,
      );
      const scripthash = scripthashMatch?.[1];

      console.log(`[BTC MOCK] Scripthash request: ${scripthash}`);

      // Return funding transaction for the E2E test address
      if (scripthash === E2E_BTC_SCRIPTHASH) {
        console.log(`[BTC MOCK] ✓ Matched scripthash - returning FUNDING_TX`);
        console.log(`[BTC MOCK] TX value: ${FUNDING_TX.vout[0].value} sats`);
        console.log(
          `[BTC MOCK] TX addr: ${FUNDING_TX.vout[0].scriptpubkey_address}`,
        );
        return { statusCode: 200, json: [FUNDING_TX] };
      }

      // Return empty for all other addresses (change addresses, etc.)
      console.log(`[BTC MOCK] No match - returning empty array`);
      return { statusCode: 200, json: [] };
    });

/**
 * Mock transaction details endpoint.
 * Required by BDK to fetch full transaction data.
 *
 * @param mockServer - The mock server instance
 */
const mockTxDetails = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/tx\/[a-f0-9]{64}$/u,
    )
    .always()
    .thenCallback((request) => {
      const txidMatch = request.url.match(/\/tx\/([a-f0-9]{64})$/u);
      const txid = txidMatch?.[1];

      console.log(`[BTC MOCK] Transaction details request: ${txid}`);

      if (txid === FUNDING_TX_ID) {
        console.log(`[BTC MOCK] ✓ Returning FUNDING_TX details`);
        return { statusCode: 200, json: FUNDING_TX };
      }

      console.log(`[BTC MOCK] ⚠️ Unknown txid - returning 404`);
      return { statusCode: 404, body: 'Transaction not found' };
    });

/**
 * Mock block details endpoint.
 * Required by BDK to fetch block information.
 *
 * @param mockServer - The mock server instance
 */
const mockBlockDetails = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/block\/[a-f0-9]{64}$/u,
    )
    .always()
    .thenCallback((request) => {
      const hashMatch = request.url.match(/\/block\/([a-f0-9]{64})$/u);
      const blockHash = hashMatch?.[1];

      console.log(`[BTC MOCK] Block details request: ${blockHash}`);

      if (blockHash === FUNDING_BLOCK_HASH) {
        return {
          statusCode: 200,
          json: {
            id: FUNDING_BLOCK_HASH,
            height: FUNDING_BLOCK_HEIGHT,
            version: 536870912,
            timestamp: 1768824955,
            tx_count: 3161,
            size: 1772079,
            weight: 3993186,
            merkle_root:
              'd7ee3bf9abfd65a43de37042f52a889e68634c0332af467d90c2e1997d230888',
            previousblockhash:
              '00000000000000000000b64f4ad246c16dfcbb1e9a236639b4d1f256c9a4450c',
            mediantime: 1768823066,
            nonce: 1134465253,
            bits: 386001906,
            difficulty: 146472570619930.78,
          },
        };
      }

      return { statusCode: 404, body: 'Block not found' };
    });

/**
 * Mock block height endpoint.
 * Required by BDK to get block hash at specific height.
 *
 * @param mockServer - The mock server instance
 */
const mockBlockHeight = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/block-height\/\d+$/u,
    )
    .always()
    .thenCallback((request) => {
      const heightMatch = request.url.match(/\/block-height\/(\d+)$/u);
      const height = heightMatch?.[1];

      console.log(`[BTC MOCK] Block height request: ${height}`);

      if (height === '0') {
        return { statusCode: 200, body: GENESIS_BLOCK_HASH };
      }

      if (height === String(FUNDING_BLOCK_HEIGHT)) {
        return { statusCode: 200, body: FUNDING_BLOCK_HASH };
      }

      // Return a generic hash for other heights
      return {
        statusCode: 200,
        body: '0000000000000000000000000000000000000000000000000000000000000000',
      };
    });

const mockFeeEstimates = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/fee-estimates$/u,
    )
    .always()
    .thenCallback(() => {
      console.log('[BTC MOCK] Fee estimates endpoint called');
      return {
        statusCode: 200,
        json: {
          '144': 1.075,
          '4': 1.308,
          '10': 1.075,
          '504': 1.023,
          '1008': 1.023,
          '3': DEFAULT_BTC_FEE_RATE,
          '13': 1.075,
          '15': 1.075,
          '22': 1.075,
          '24': 1.075,
          '16': 1.075,
          '7': 1.075,
          '25': 1.075,
          '23': 1.075,
          '19': 1.075,
          '14': 1.075,
          '20': 1.075,
          '12': 1.075,
          '1': 2.006,
          '2': 2.006,
          '11': 1.075,
          '17': 1.075,
          '18': 1.075,
          '9': 1.075,
          '8': 1.075,
          '6': 1.075,
          '21': 1.075,
          '5': 1.308,
        },
      };
    });

/**
 * Catch-all for any Bitcoin Infura requests that are not mocked.
 * Helps debug which endpoints are being called.
 *
 * @param mockServer - The mock server instance
 */
const mockCatchAllBitcoin = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/.*/u,
    )
    .always()
    .thenCallback((request) => {
      console.log(`[BTC MOCK] ⚠️ UNHANDLED Bitcoin request: ${request.url}`);
      return { statusCode: 404, body: 'Not mocked' };
    });

/**
 * Mocks the Esplora API calls for Bitcoin E2E tests.
 *
 * This mock is configured for the deterministic Bitcoin address derived from E2E_SRP:
 * - Address: bc1qk9u7870r6zrjr6euzkdyx5np94wkduvul0zmg7
 * - Scripthash: 7df1af9edc3f17e4e228fd287a14dfb79fc9f4155e2418152536cc7a3e249ba4
 *
 * The mock returns a funding transaction with DEFAULT_BTC_BALANCE (1 BTC) for this address.
 *
 * @param mockServer - The mock server instance
 */
export async function mockInitialFullScan(mockServer: Mockttp) {
  // Mock latest blocks - required by BDK for chain tip
  await mockBlocks(mockServer);

  // Mock scripthash/*/txs - returns FUNDING_TX for E2E address
  await mockAllScriptHashTxs(mockServer);

  // Mock transaction details - required by BDK
  await mockTxDetails(mockServer);

  // Mock block details - required by BDK
  await mockBlockDetails(mockServer);

  // Mock block height lookups - required by BDK
  await mockBlockHeight(mockServer);

  // Mock fee estimates - required for transaction building
  await mockFeeEstimates(mockServer);

  // Catch-all for debugging
  await mockCatchAllBitcoin(mockServer);
}
