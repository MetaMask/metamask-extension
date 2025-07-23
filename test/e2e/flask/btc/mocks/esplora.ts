import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

const ESPLORA_URL = 'https://blockstream.info/api';
const FUNDING_SCRIPT_HASH =
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';
const FUNDING_BLOCK_HEIGHT = 867936;
const FUNDING_BLOCK_HASH =
  '00000000000000000002ef0f9552a3bb1593e1cf85fc12e7eea1d96116281ba8';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

const mockBlocks = (mockServer: Mockttp) =>
  mockServer.forGet(`${ESPLORA_URL}/blocks`).thenJson(200, [
    {
      id: '000000000000000000021db6a261dda16e3f27c452e0c204b23d59f2613cd04c',
      height: 887763,
      version: 1073676288,
      timestamp: 1741950277,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 3566,
      size: 1651280,
      weight: 3993557,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        '5aacadbd045e88ea5ba2bb0d0aee30644023dc852938a2250fd77dad0189472e',
      previousblockhash:
        '00000000000000000001a685990ab871a9e9be147f59812ae844f859283cf088',
      mediantime: 1741945781,
      nonce: 246132581,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '00000000000000000001a685990ab871a9e9be147f59812ae844f859283cf088',
      height: 887762,
      version: 754696192,
      timestamp: 1741949338,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 3105,
      size: 1480943,
      weight: 3993548,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        '2b725c0f22e3b059596a53e13fd29d3adee29a7c5a3ec30c5d9cb4b8a9e7261e',
      previousblockhash:
        '0000000000000000000109c1a305a19da7fee96092021a1a7fe7363386279ab1',
      mediantime: 1741945773,
      nonce: 719962452,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '0000000000000000000109c1a305a19da7fee96092021a1a7fe7363386279ab1',
      height: 887761,
      version: 804413440,
      timestamp: 1741948491,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 4253,
      size: 1677299,
      weight: 3993575,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        'e83f599abbdcd2a09e96670006e8a93fbee5e5642947ab463b55d1637e1d661d',
      previousblockhash:
        '0000000000000000000034323dc3fa671060b93ba3a421c27cba39ceb1de8843',
      mediantime: 1741945166,
      nonce: 517023298,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '0000000000000000000034323dc3fa671060b93ba3a421c27cba39ceb1de8843',
      height: 887760,
      version: 831963136,
      timestamp: 1741946442,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 2084,
      size: 1929984,
      weight: 3993432,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        'f3a5b19bb7884df6ad1ca4a474122f9e0587bc3b85032d8c38f29bab95c8e973',
      previousblockhash:
        '00000000000000000001123b630d39c91e4c5dcde69c54134cc0bbd0332e9115',
      mediantime: 1741944725,
      nonce: 947916899,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '00000000000000000001123b630d39c91e4c5dcde69c54134cc0bbd0332e9115',
      height: 887759,
      version: 706740224,
      timestamp: 1741946076,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 1251,
      size: 1751958,
      weight: 3993528,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        '33bb0ddb000c63ec61ba9e0ddc54e32bf84b014b2954a552e57677f32caadd07',
      previousblockhash:
        '00000000000000000001408a02d31da68a817fec8483e5d0230c9a054083bc3d',
      mediantime: 1741943549,
      nonce: 2469229960,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '00000000000000000001408a02d31da68a817fec8483e5d0230c9a054083bc3d',
      height: 887758,
      version: 872415232,
      timestamp: 1741945781,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 613,
      size: 1994608,
      weight: 3993517,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        'd8972b9df4bb61c5be2f7d58e54332d69007cc53f86e29c5c9137631e0c97b6f',
      previousblockhash:
        '000000000000000000027277f2bb1b2800ec8f6c193fb2f315d224e9167449ec',
      mediantime: 1741942539,
      nonce: 3395599209,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '000000000000000000027277f2bb1b2800ec8f6c193fb2f315d224e9167449ec',
      height: 887757,
      version: 610516992,
      timestamp: 1741945773,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 2050,
      size: 1858224,
      weight: 3993585,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        'ba867961dd6221c444a4097c5482ef8a0510a7b70ff5c50f815d2c71565fbcdb',
      previousblockhash:
        '000000000000000000003b14929b0adc5471bc0a86b75e90470fad671265a82a',
      mediantime: 1741941813,
      nonce: 1079579948,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '000000000000000000003b14929b0adc5471bc0a86b75e90470fad671265a82a',
      height: 887756,
      version: 537149440,
      timestamp: 1741945166,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 1773,
      size: 1960675,
      weight: 3993697,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        '08780e40338229610196839f08fe97d63f43118732d1e2a27dc134c0a3b1008e',
      previousblockhash:
        '00000000000000000001b9a974ead95fe0e63e5fb814696e6e08ce867a4f5e1a',
      mediantime: 1741941724,
      nonce: 139779852,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '00000000000000000001b9a974ead95fe0e63e5fb814696e6e08ce867a4f5e1a',
      height: 887755,
      version: 536870912,
      timestamp: 1741944725,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 3345,
      size: 1689981,
      weight: 3993564,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        '3cdaf81ee75473376ab8d98c7a21be1328e297ba6a0359d587f326636337b800',
      previousblockhash:
        '0000000000000000000163ae1ab6b21bb03c0e51a890be4449a019b52a147885',
      mediantime: 1741940909,
      nonce: 4096688158,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
    {
      id: '0000000000000000000163ae1ab6b21bb03c0e51a890be4449a019b52a147885',
      height: 887754,
      version: 537853952,
      timestamp: 1741943549,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tx_count: 3124,
      size: 1650915,
      weight: 3993909,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      merkle_root:
        'de7ccff11839f98848893a5bd92f5361e6b6b91a22dc0b9b0e8dd28909ff5721',
      previousblockhash:
        '000000000000000000024e0490547c1878fcc4f018d70c6d0897f79c76de2888',
      mediantime: 1741940743,
      nonce: 3819108766,
      bits: 386040449,
      difficulty: 112149504190349.28,
    },
  ]);

const mockFundingTx = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${ESPLORA_URL}/scripthash/${FUNDING_SCRIPT_HASH}/txs`)
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
      /^https:\/\/blockstream\.info\/api\/scripthash\/[0-9a-f]{64}\/txs$/u,
    )
    .thenJson(200, []);

const mockBlockHeight = (
  mockServer: Mockttp,
  blockHeight: number,
  blockHash: string,
) =>
  mockServer
    .forGet(`${ESPLORA_URL}/block-height/${blockHeight}`)
    .thenReply(200, blockHash);

const mockFeeEstimates = (mockServer: Mockttp) =>
  mockServer.forGet(`${ESPLORA_URL}/fee-estimates`).thenJson(200, {
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
  await mockBlocks(mockServer);
  // Mock the funding transaction setting the balance to default
  await mockFundingTx(mockServer);
  // Mock funding tx block hash
  await mockBlockHeight(mockServer, FUNDING_BLOCK_HEIGHT, FUNDING_BLOCK_HASH);
  // Mock other calls to fetch txs given the stop gap (returns empty)
  await mockAnyTxs(mockServer);
  // Mock genesis block hash
  await mockBlockHeight(mockServer, 0, GENESIS_BLOCK_HASH);
  // Mock fee estimates
  await mockFeeEstimates(mockServer);
}
