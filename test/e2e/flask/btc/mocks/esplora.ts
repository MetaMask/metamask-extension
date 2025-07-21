import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

const ESPLORA_URL = 'https://blockstream.info/api';
const ESPLORA_TESTNET_URL = 'https://blockstream.info/testnet/api';

const FUNDING_SCRIPT_HASH =
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';
const FUNDING_BLOCK_HEIGHT = 867936;
const FUNDING_BLOCK_HASH =
  '00000000000000000002ef0f9552a3bb1593e1cf85fc12e7eea1d96116281ba8';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

const GENESIS_BLOCK_HASH_TESTNET =
  '000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943';
/* eslint-disable @typescript-eslint/naming-convention */

const mockBlocks = (mockServer: Mockttp, network: string = ESPLORA_URL) => {
  if (network === ESPLORA_URL) {
    return mockServer.forGet(`${network}/blocks`).thenJson(200, [
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
  }
  return mockServer.forGet(`${network}/blocks`).thenJson(200, [
    {
      id: '000000000000004fec1a9218d8c41a943d051be49fe342e396f721c83f4083e9',
      height: 4550187,
      version: 600211456,
      timestamp: 1751887002,
      tx_count: 2711,
      size: 896683,
      weight: 1895338,
      merkle_root:
        'dd84f11e588cc025662de19acb8ff8d32cb9dcfec96cbc8e64af40ed5df70ed9',
      previousblockhash:
        '00000000000000124d660c6ec21732a68a7fa81a4b22775bb47dcc5de2e3745e',
      mediantime: 1751885302,
      nonce: 4054984287,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '00000000000000124d660c6ec21732a68a7fa81a4b22775bb47dcc5de2e3745e',
      height: 4550186,
      version: 916086784,
      timestamp: 1751886943,
      tx_count: 4829,
      size: 2097842,
      weight: 3992672,
      merkle_root:
        '34900bf6fdaee2b9f0a103593828e83e8ebb286f4718afa28a6ea2cf8baf580c',
      previousblockhash:
        '000000000000002be0fc8e5ca8d6b3a7879d122ae0b2f7117da75a6fa7539869',
      mediantime: 1751884265,
      nonce: 775474460,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '000000000000002be0fc8e5ca8d6b3a7879d122ae0b2f7117da75a6fa7539869',
      height: 4550185,
      version: 563265536,
      timestamp: 1751886387,
      tx_count: 5498,
      size: 2147958,
      weight: 3992832,
      merkle_root:
        '4104888376b1f3f49047b1ecd68aa4f79ec9ae860b987584ec4e364a43e8f194',
      previousblockhash:
        '0000000000000031f3ef48c2c0778ff70460c9d9486b2e46809a3e12d3984b9b',
      mediantime: 1751883886,
      nonce: 2031361340,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '0000000000000031f3ef48c2c0778ff70460c9d9486b2e46809a3e12d3984b9b',
      height: 4550184,
      version: 712982528,
      timestamp: 1751886347,
      tx_count: 5065,
      size: 2121846,
      weight: 3991992,
      merkle_root:
        '13b14f9db821f8ff73db09ac9ab77056bc52a79074ff6c307c6870eb63cb5145',
      previousblockhash:
        '0000000000000042897167136f2f49351393110a15ce86d0212cf33fad9df785',
      mediantime: 1751882685,
      nonce: 1728331074,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '0000000000000042897167136f2f49351393110a15ce86d0212cf33fad9df785',
      height: 4550183,
      version: 860667904,
      timestamp: 1751886171,
      tx_count: 4754,
      size: 2080834,
      weight: 3993001,
      merkle_root:
        '4c822bb992bfe9914fe1efdb9f22c7e5e50e6e7f6e9ff173e8219e43bf096b1a',
      previousblockhash:
        '0000000000000027855ed4c55bf8f7c76a715fffd62ddf37917516af8e1d8bf5',
      mediantime: 1751882423,
      nonce: 2527139588,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '0000000000000027855ed4c55bf8f7c76a715fffd62ddf37917516af8e1d8bf5',
      height: 4550182,
      version: 686129152,
      timestamp: 1751885302,
      tx_count: 4874,
      size: 2104707,
      weight: 3992889,
      merkle_root:
        'f8d89b7019f22c341b81beffe1ff0e61fa22455cf004ff1d6d9fb7bf73ed91ac',
      previousblockhash:
        '0000000000000032472dd9eb6b12eec95732c58c410af315fa4434d668218bb2',
      mediantime: 1751882380,
      nonce: 1673945372,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '0000000000000032472dd9eb6b12eec95732c58c410af315fa4434d668218bb2',
      height: 4550181,
      version: 839843840,
      timestamp: 1751884265,
      tx_count: 4927,
      size: 2089895,
      weight: 3993044,
      merkle_root:
        '839d1add0b309c3c27555a7c4ccd486ed0331e0a6cc1e043a43830e28c61e2f7',
      previousblockhash:
        '00000000000038b4c0bbc3717d739c37cadc42f52d374f68423d11c09e2d34bf',
      mediantime: 1751882175,
      nonce: 3695420810,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '00000000000038b4c0bbc3717d739c37cadc42f52d374f68423d11c09e2d34bf',
      height: 4550180,
      version: 793632768,
      timestamp: 1751883886,
      tx_count: 4808,
      size: 2100645,
      weight: 3992580,
      merkle_root:
        '7dbe27de28c2ee693e6ddb75e653104a268562257f9369c7e7e5035f47dd709d',
      previousblockhash:
        '000000000000003914d375ddde4380052fdfa25931ae27a99b03f79927e01754',
      mediantime: 1751881920,
      nonce: 2878098808,
      bits: 486604799,
      difficulty: 1.0,
    },
    {
      id: '000000000000003914d375ddde4380052fdfa25931ae27a99b03f79927e01754',
      height: 4550179,
      version: 760152064,
      timestamp: 1751882685,
      tx_count: 2297,
      size: 962854,
      weight: 1829797,
      merkle_root:
        'c7767de9ea77551759891161f528142efed30d9473fd03b5f34a9b380ad9f7bf',
      previousblockhash:
        '00000000000000399562cb2b8d89889e003075be7d48000a75f766b0a4dbfd09',
      mediantime: 1751881677,
      nonce: 3754955574,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
    {
      id: '00000000000000399562cb2b8d89889e003075be7d48000a75f766b0a4dbfd09',
      height: 4550178,
      version: 603316224,
      timestamp: 1751882423,
      tx_count: 315,
      size: 129553,
      weight: 247645,
      merkle_root:
        'cfa46855a543701a7d14611eae123209fd9cbac0d85bad2ddd04c32abf9e6266',
      previousblockhash:
        '00000000000000040ec1cd692e5085f0fb1280e152a3165bd0083c87569ebb15',
      mediantime: 1751880825,
      nonce: 1242810144,
      bits: 424709359,
      difficulty: 53319353.63456318,
    },
  ]);
};

const mockFundingTx = (mockServer: Mockttp, network: string = ESPLORA_URL) =>
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
      /^https:\/\/blockstream\.info\/(api|testnet\/api)\/scripthash\/[0-9a-f]{64}\/txs$/u,
    )
    .thenJson(200, []);

const mockBlockHeight = (
  mockServer: Mockttp,
  blockHeight: number,
  blockHash: string,
  network: string = ESPLORA_URL,
) =>
  mockServer
    .forGet(`${network}/block-height/${blockHeight}`)
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
  await mockBlocks(mockServer);
  await mockBlocks(mockServer, ESPLORA_TESTNET_URL);
  // Mock the funding transaction setting the balance to default
  await mockFundingTx(mockServer);
  await mockFundingTx(mockServer, ESPLORA_TESTNET_URL);
  // Mock funding tx block hash
  await mockBlockHeight(mockServer, FUNDING_BLOCK_HEIGHT, FUNDING_BLOCK_HASH);
  await mockBlockHeight(
    mockServer,
    FUNDING_BLOCK_HEIGHT,
    FUNDING_BLOCK_HASH,
    ESPLORA_TESTNET_URL,
  );
  // Mock other calls to fetch txs given the stop gap (returns empty)
  await mockAnyTxs(mockServer);
  // Mock genesis block hash
  await mockBlockHeight(mockServer, 0, GENESIS_BLOCK_HASH);
  await mockBlockHeight(
    mockServer,
    0,
    GENESIS_BLOCK_HASH_TESTNET,
    ESPLORA_TESTNET_URL,
  );
  // Mock fee estimates
  await mockFeeEstimates(mockServer);
  await mockFeeEstimates(mockServer, ESPLORA_TESTNET_URL);
}
