import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

const ESPLORA_URL = 'https://esplora.rivet.link/esplora/api';
const INFURA_BTC_MAINNET_URL =
  'https://bitcoin-mainnet.infura.io/v3/5b98a22672004ef1bf40a80123c5c48d';

const FUNDING_SCRIPT_HASH =
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';
const FUNDING_BLOCK_HEIGHT = 867936;
const FUNDING_BLOCK_HASH =
  '00000000000000000002ef0f9552a3bb1593e1cf85fc12e7eea1d96116281ba8';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

/* eslint-disable @typescript-eslint/naming-convention */

const mockBlocks = (
  mockServer: Mockttp,
  network: string = INFURA_BTC_MAINNET_URL,
) => {
  if (network === INFURA_BTC_MAINNET_URL) {
    return mockServer.forGet(`${network}/esplora/blocks`).thenJson(200, [
      {
        id: '000000000000000000005645962b8ea026323dd3eb24a7ee39c60f285a259bc2',
        height: 918176,
        version: 566566912,
        timestamp: 1759922068,
        tx_count: 3575,
        size: 1681759,
        weight: 3993790,
        merkle_root:
          '7672f7b0d4a6d322ddbdb5b6aa1802352329862af3d116c3aedef2efc167c9e5',
        previousblockhash:
          '000000000000000000012dca96f7e4803c607e2f34d41a2a7ae8f4afb00ae1a7',
        mediantime: 1759919229,
        nonce: 3365112101,
        bits: 385998260,
        difficulty: 150839487445890.5,
      },
      {
        id: '000000000000000000012dca96f7e4803c607e2f34d41a2a7ae8f4afb00ae1a7',
        height: 918175,
        version: 1040187392,
        timestamp: 1759921295,
        tx_count: 3801,
        size: 1642907,
        weight: 3993518,
        merkle_root:
          'd4e542752e01040b575db060cbb3efc40800fefc234b102e196e90a11fe7b99d',
        previousblockhash:
          '00000000000000000000197762f3b38879ed3c4ed0e96d66d203879c51f9f27c',
        mediantime: 1759917935,
        nonce: 2255807358,
        bits: 385998260,
        difficulty: 150839487445890.5,
      },
      {
        id: '00000000000000000000197762f3b38879ed3c4ed0e96d66d203879c51f9f27c',
        height: 918174,
        version: 579330048,
        timestamp: 1759920849,
        tx_count: 3250,
        size: 1756669,
        weight: 3993331,
        merkle_root:
          'bfa30d00c8fd4c2537029f2880a63aad0dda5a0102f7017f73531d08704a23e6',
        previousblockhash:
          '00000000000000000000bfe2dfa7db0249854da123686810fc678b2e6e596576',
        mediantime: 1759917929,
        nonce: 1749894252,
        bits: 385998260,
        difficulty: 150839487445890.5,
      },
    ]);
  }
  return mockServer.forGet(`${network}/esplora/blocks`).thenJson(200, []);
};

const mockFundingTx = (
  mockServer: Mockttp,
  network: string = INFURA_BTC_MAINNET_URL,
) =>
  mockServer
    .forGet(`${network}/scripthash/${FUNDING_SCRIPT_HASH}/txs`)
    .thenJson(200, [
      {
        txid: '6e7ebcc607a83f7cf5659fb6fb70433c775017092302630f027ca728b4d06aba',
        version: 2,
        locktime: 0,
        vin: [
          {
            txid: '7274041ef11904e40883b4e930e1e76e69a671f6a0e4f5b7c49df06a55373b6b',
            vout: 1,
            prevout: {
              scriptpubkey: '001480198104d643031fb951787d24a79c04dc5086b2',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              scriptpubkey_asm:
                'OP_0 OP_PUSHBYTES_20 80198104d643031fb951787d24a79c04dc5086b2',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              scriptpubkey_type: 'v0_p2wpkh',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              scriptpubkey_address:
                'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf',
              value: 100356748,
            },
            scriptsig: '',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scriptsig_asm: '',
            witness: [
              '30440220459a41e0eef41b3b84225d00e62ca12a2f408ff65f5ce135ac688c6501d1705702202fba61d2b40d319b8a022ba67fedf55d64167f9dd26a6a1809549d6cf2fefeae01',
              '0233f916944c2d3c2024d6e4038274e8f5af0d072d08411b2fc28bea04b521387a',
            ],
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_coinbase: false,
            sequence: 4294967293,
          },
        ],
        vout: [
          // This is the funding UTXO representing the amount of 1 BTC that we receive
          {
            scriptpubkey: '00145777b0d2f1b6c0c97e1a1f7db1848ee553d88540',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 5777b0d2f1b6c0c97e1a1f7db1848ee553d88540',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scriptpubkey_type: 'v0_p2wpkh',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scriptpubkey_address: DEFAULT_BTC_ADDRESS,
            value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC,
          },
          {
            scriptpubkey: '001480198104d643031fb951787d24a79c04dc5086b2',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 80198104d643031fb951787d24a79c04dc5086b2',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scriptpubkey_type: 'v0_p2wpkh',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            scriptpubkey_address: 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf',
            value: 346748,
          },
        ],
        size: 222,
        weight: 561,
        fee: 10000,
        status: {
          confirmed: true,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          block_height: FUNDING_BLOCK_HEIGHT,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          block_hash: FUNDING_BLOCK_HASH,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          block_time: 1730210935,
        },
      },
    ]);

const mockAnyTxs = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet.infura.io\/v3\/5b98a22672004ef1bf40a80123c5c48d\/esplora\/scripthash\/[0-9a-f]{64}\/txs$/u,
    )
    .thenJson(200, []);

const mockBlockHeight = (
  mockServer: Mockttp,
  blockHeight: number,
  blockHash: string,
  network: string = INFURA_BTC_MAINNET_URL,
) =>
  mockServer
    .forGet(`${network}/esplora/block-height/${blockHeight}`)
    .thenReply(200, blockHash);

const mockFeeEstimates = (mockServer: Mockttp, network: string = ESPLORA_URL) =>
  mockServer.forGet(`${network}/fee-estimates`).thenJson(200, {
    '144': 1.075,
    '4': 1.308,
    '10': 1.075,
    '504': 1.0230000000000001,
    '1008': 1.0230000000000001,
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
    '1': 2.0060000000000002,
    '2': 2.0060000000000002,
    '11': 1.075,
    '17': 1.075,
    '18': 1.075,
    '9': 1.075,
    '8': 1.075,
    '6': 1.075,
    '21': 1.075,
    '5': 1.308,
  });

/**
 * Mocks the Esplora calls needed for the initial full scan.
 * Consists of 1 transaction on the first address of the account.
 *
 * @param mockServer - The mock server
 */
export async function mockInitialFullScan(mockServer: Mockttp) {
  // Mock latest blocks
  await mockBlocks(mockServer, INFURA_BTC_MAINNET_URL);
  // await mockBlocks(mockServer, ESPLORA_TESTNET_URL);
  // Mock the funding transaction setting the balance to default
  await mockFundingTx(mockServer, INFURA_BTC_MAINNET_URL);
  // await mockFundingTx(mockServer, ESPLORA_TESTNET_URL);
  // Mock funding tx block hash
  // await mockBlockHeight(mockServer, FUNDING_BLOCK_HEIGHT, FUNDING_BLOCK_HASH, INFURA_BTC_MAINNET_URL);
  /* await mockBlockHeight(
    mockServer,
    FUNDING_BLOCK_HEIGHT,
    FUNDING_BLOCK_HASH,
    ESPLORA_TESTNET_URL,
  );*/
  // Mock other calls to fetch txs given the stop gap (returns empty)
  await mockAnyTxs(mockServer);
  // Mock genesis block hash
  await mockBlockHeight(
    mockServer,
    0,
    GENESIS_BLOCK_HASH,
    INFURA_BTC_MAINNET_URL,
  );

  // Mock fee estimates
  await mockFeeEstimates(mockServer);
  // await mockFeeEstimates(mockServer, ESPLORA_TESTNET_URL);
}
