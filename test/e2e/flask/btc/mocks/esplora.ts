import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

/* eslint-disable @typescript-eslint/naming-convention */

const FUNDING_BLOCK_HEIGHT = 932935;
const FUNDING_BLOCK_HASH =
  '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

const mockBlocks = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/blocks$/u,
    )
    .always()
    .thenJson(200, [
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
        previousblockhash:
          '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748',
        mediantime: 1768823212,
        nonce: 1426240500,
        bits: 386001906,
        difficulty: 146472570619930.78,
      },
      {
        id: '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748',
        height: 932935,
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
    ]);

// The funding transaction that gives DEFAULT_BTC_ADDRESS its balance
const FUNDING_TX = {
  txid: 'd4ee940ad6b4db119fa75cd54797ec9c1e857352d2e9fc11e5eacb65918b2275',
  version: 2,
  locktime: 932934,
  vin: [
    {
      txid: 'e52c14e21e6455fae1d46298d0790583bf5dd41b3b82866d5179dbec3c405921',
      vout: 0,
      prevout: {
        scriptpubkey: '0014c461ef6b51c2e69a426232204a0ddf6d877c3a1a',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 c461ef6b51c2e69a426232204a0ddf6d877c3a1a',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: 'bc1qc3s77663ctnf5snzxgsy5rwldkrhcws6vkultr',
        value: 100356748,
      },
      scriptsig: '',
      scriptsig_asm: '',
      witness: [
        '304402203af616fea30c94d9a3e873ac9c672ec77228072c2e4e59c665696b821b86148b022040144d7e6063d6382381b9a503ed5aa67ec3b99436c5f069ee18be9f8ab83d3901',
        '0370be84f37bbf9d957d2986269271267c704ff21f109e0274c7512852b45489f8',
      ],
      is_coinbase: false,
      sequence: 4294967293,
    },
  ],
  vout: [
    {
      // Change output (not ours)
      scriptpubkey: '0014d71b0b2365ebd558632aa758834a30f69ba7613e',
      scriptpubkey_asm:
        'OP_0 OP_PUSHBYTES_20 d71b0b2365ebd558632aa758834a30f69ba7613e',
      scriptpubkey_type: 'v0_p2wpkh',
      scriptpubkey_address: 'bc1q6udskgm9a024sce25avgxj3s76d6wcf7uy77pu',
      value: 65156,
    },
    {
      // This is the funding UTXO for DEFAULT_BTC_ADDRESS
      // scriptpubkey = 0014 + witness_program (469d76e8387e11cbe9010c72ee4b748dd9152fa5)
      scriptpubkey: '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
      scriptpubkey_asm:
        'OP_0 OP_PUSHBYTES_20 469d76e8387e11cbe9010c72ee4b748dd9152fa5',
      scriptpubkey_type: 'v0_p2wpkh',
      scriptpubkey_address: DEFAULT_BTC_ADDRESS,
      value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC,
    },
  ],
  size: 222,
  weight: 561,
  fee: 141,
  status: {
    confirmed: true,
    block_height: FUNDING_BLOCK_HEIGHT,
    block_hash: FUNDING_BLOCK_HASH,
    block_time: 1768824955,
  },
};

// Mock ALL scripthash/*/txs requests to return the funding transaction
// The snap will filter which outputs belong to which address based on scriptpubkey_address
const mockAllScripthashTxs = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/scripthash\/[0-9a-f]{64}\/txs$/u,
    )
    .always()
    .thenJson(200, [FUNDING_TX]);

const mockBlockHeight = (
  mockServer: Mockttp,
  blockHeight: number,
  blockHash: string,
) =>
  mockServer
    .forGet(
      new RegExp(
        `^https:\\/\\/bitcoin-mainnet\\.infura\\.io\\/v3\\/[a-f0-9]{32}\\/esplora\\/block-height\\/${blockHeight}$`,
        'u',
      ),
    )
    .always()
    .thenReply(200, blockHash);

const mockFeeEstimates = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/fee-estimates$/u,
    )
    .always()
    .thenJson(200, {
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
    });

// Catch-all for any Bitcoin Infura requests that are not mocked
// This helps debug which endpoints are being called
const mockCatchAllBitcoin = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/.*/u,
    )
    .always()
    .thenCallback((request) => {
      console.log(`[BTC MOCK] Unhandled Bitcoin request: ${request.url}`);
      return { statusCode: 404, body: 'Not mocked' };
    });

/**
 * Mocks the Esplora calls needed for the initial full scan.
 * Consists of 1 transaction on the first address of the account.
 *
 * @param mockServer - The mock server
 */
export async function mockInitialFullScan(mockServer: Mockttp) {
  // Mock latest blocks
  await mockBlocks(mockServer);

  // Mock ALL scripthash/*/txs requests to return the funding transaction
  // The snap will filter outputs by scriptpubkey_address
  await mockAllScripthashTxs(mockServer);

  // Mock funding tx block hash
  await mockBlockHeight(mockServer, FUNDING_BLOCK_HEIGHT, FUNDING_BLOCK_HASH);

  // Mock genesis block hash (required by BDK)
  await mockBlockHeight(mockServer, 0, GENESIS_BLOCK_HASH);

  // Mock fee estimates
  await mockFeeEstimates(mockServer);

  // Catch-all for debugging - should be registered last
  await mockCatchAllBitcoin(mockServer);
}
