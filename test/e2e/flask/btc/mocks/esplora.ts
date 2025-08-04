import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

const ESPLORA_URL = 'https://blockstream.info/api';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

const FUNDING_SCRIPT_HASH =
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';
const FUNDING_BLOCK_HEIGHT = 903794;
const FUNDING_BLOCK_HASH =
  '00000000000000000001860e779f8ede30fa1dbb97f0219a57815fed2ad82fa5';

const CHANGE_SCRIPT_HASH =
  'b6f36165aabf4c031eea1f5ba8b005cba85ac7cbcc967bf3ffe5f5a38c1db71c';
const CHANGE_BLOCK_HEIGHT = 904600;
const CHANGE_BLOCK_HASH =
  '00000000000000000001ca90dbba040de4966b7df64eaad8f3970d129dca7244';

/* eslint-disable @typescript-eslint/naming-convention */

const mockBlocks = (mockServer: Mockttp, network: string = ESPLORA_URL) =>
  mockServer.forGet(`${network}/blocks`).thenJson(200, [
    {
      id: '00000000000000000000cc8a45ff841efad7f74a654664f0dde0b463463b719b',
      height: 908555,
      version: 537239552,
      timestamp: 1754308306,
      tx_count: 2782,
      size: 1720164,
      weight: 3769848,
      merkle_root:
        'ec0d79728a690504c8d081af7b35170b924c2a59902521f674148fb9390440ab',
      previousblockhash:
        '000000000000000000007aaeb7106b0bda561e9726007de1d293d02f3e2c3856',
      mediantime: 1754303748,
      nonce: 1187128879,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '000000000000000000007aaeb7106b0bda561e9726007de1d293d02f3e2c3856',
      height: 908554,
      version: 536903680,
      timestamp: 1754308064,
      tx_count: 3244,
      size: 1611333,
      weight: 3992760,
      merkle_root:
        'dd7850f6437196bc68801a39eb6f68aa14c07e2656922e1d7d5bf9ee14cfeb0e',
      previousblockhash:
        '00000000000000000001451aea22bdc2a94867d9d21de424ce049273dad75bf7',
      mediantime: 1754303733,
      nonce: 1627356335,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '00000000000000000001451aea22bdc2a94867d9d21de424ce049273dad75bf7',
      height: 908553,
      version: 536903680,
      timestamp: 1754307949,
      tx_count: 3401,
      size: 1708824,
      weight: 3993087,
      merkle_root:
        'd3fdeeae561de7af3ce10a75007f3540190534f7a5894a21304057631611d70f',
      previousblockhash:
        '00000000000000000001bfe514e1f7c1b2145f1b160a737bdd75ef57f12df23e',
      mediantime: 1754302642,
      nonce: 1230490634,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '00000000000000000001bfe514e1f7c1b2145f1b160a737bdd75ef57f12df23e',
      height: 908552,
      version: 630194176,
      timestamp: 1754307407,
      tx_count: 3369,
      size: 1515681,
      weight: 3993522,
      merkle_root:
        '8759b34675cce2792760acfa70791d93bd4ba5b19eb81e1ad6f84202d50af54e',
      previousblockhash:
        '00000000000000000001804fb68e8de90e673dd668bf65c40cd405d9b8b429ea',
      mediantime: 1754302596,
      nonce: 1450530180,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '00000000000000000001804fb68e8de90e673dd668bf65c40cd405d9b8b429ea',
      height: 908551,
      version: 678879232,
      timestamp: 1754304844,
      tx_count: 3343,
      size: 1573105,
      weight: 3993724,
      merkle_root:
        'f0baba22070473759802a2a2743451bc82b3702a7629c2fe964a8c7ef215858e',
      previousblockhash:
        '000000000000000000010fa6fbaecd0256fd292bb05d7e63a9647c5d4b05be0c',
      mediantime: 1754301960,
      nonce: 135426869,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '000000000000000000010fa6fbaecd0256fd292bb05d7e63a9647c5d4b05be0c',
      height: 908550,
      version: 639967232,
      timestamp: 1754303748,
      tx_count: 247,
      size: 85666,
      weight: 200323,
      merkle_root:
        '39a9f9224d903dd21db767afe2e949d020a09b524b8c68dec2d7879d708d62c8',
      previousblockhash:
        '00000000000000000001a281409a576186e37b48b2abb459b18b610fba8c39d9',
      mediantime: 1754301077,
      nonce: 1157903125,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '00000000000000000001a281409a576186e37b48b2abb459b18b610fba8c39d9',
      height: 908549,
      version: 624386048,
      timestamp: 1754303733,
      tx_count: 3482,
      size: 1583803,
      weight: 3993667,
      merkle_root:
        '632712cf85fef820d409bfde892466c73a819497dfe14eb3dec3594dec796900',
      previousblockhash:
        '00000000000000000001761085a61122c49b79285bf913d6e448a2ca7370a752',
      mediantime: 1754301061,
      nonce: 3423801825,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '00000000000000000001761085a61122c49b79285bf913d6e448a2ca7370a752',
      height: 908548,
      version: 762224640,
      timestamp: 1754302642,
      tx_count: 5117,
      size: 1790757,
      weight: 3993762,
      merkle_root:
        '0dad2e6f4caaf7a44a6adfea8974062d1374cc0c0adaffc8f956b2dcfac4c6c2',
      previousblockhash:
        '00000000000000000000f729940374d7e4ca00b8478141c7e77fac02009af032',
      mediantime: 1754300690,
      nonce: 1547751978,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '00000000000000000000f729940374d7e4ca00b8478141c7e77fac02009af032',
      height: 908547,
      version: 973078528,
      timestamp: 1754302596,
      tx_count: 3255,
      size: 1950623,
      weight: 3993398,
      merkle_root:
        '0a546b600b0a4457bf28289874ba69e9185aaf2ac48a1426293f5c04d07eda55',
      previousblockhash:
        '000000000000000000003b85a8940437288c5362904ab165cf614ed32b3a7abd',
      mediantime: 1754300249,
      nonce: 412713634,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
    {
      id: '000000000000000000003b85a8940437288c5362904ab165cf614ed32b3a7abd',
      height: 908546,
      version: 537624576,
      timestamp: 1754301960,
      tx_count: 3186,
      size: 1634047,
      weight: 3993919,
      merkle_root:
        '3cb0049bdaea7ca2ae86d4937d397a3d354dc7b90e8edcd7bf8d7a8adce9b37c',
      previousblockhash:
        '0000000000000000000037b1b57f06a1e433ad3cff22c888c5a7892e24dfe401',
      mediantime: 1754300177,
      nonce: 2879880578,
      bits: 386020510,
      difficulty: 127620086886391.78,
    },
  ]);

const mockFundingTx = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${ESPLORA_URL}/scripthash/${FUNDING_SCRIPT_HASH}/txs`)
    .thenJson(200, [
      {
        txid: '67c7e6b19e0740cf577d5b9aaf1b4107474e9f41fa5360d4de1ac890f617f3d9',
        version: 2,
        locktime: 904598,
        vin: [
          {
            txid: '4fe35cef8765cc42c7098a10f1e39aebaee1fbb4b586dc1cd27389cc591396a3',
            vout: 0,
            prevout: {
              scriptpubkey: '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
              scriptpubkey_asm:
                'OP_0 OP_PUSHBYTES_20 469d76e8387e11cbe9010c72ee4b748dd9152fa5',
              scriptpubkey_type: 'v0_p2wpkh',
              scriptpubkey_address: DEFAULT_BTC_ADDRESS,
              value: 91392,
            },
            scriptsig: '',
            scriptsig_asm: '',
            witness: [
              '304402200f3fd86d09903faf976400fe14337f02e28817def6ae61d41d26f528592dd7a00220230e90e38473e9909d3cbcae075114c2d5a6bf2146e8cbbce940f5de689c1c1801',
              '02152a1eac05eee4a91226592fb65b7228f545cbc75454e31f2756def122a1f892',
            ],
            is_coinbase: false,
            sequence: 4294967293,
          },
        ],
        vout: [
          {
            scriptpubkey: '00147f0f7e6dc90c4aa3bee503a7017b2c9bce3ae71b',
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 7f0f7e6dc90c4aa3bee503a7017b2c9bce3ae71b',
            scriptpubkey_type: 'v0_p2wpkh',
            scriptpubkey_address: 'bc1q0u8humwfp39280h9qwnsz7evn08r4ecmsd5h22',
            value: 79938,
          },
          {
            scriptpubkey: '00145ebbfb6c85864ef3fe07f287b7728d9f2e8f8425',
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 5ebbfb6c85864ef3fe07f287b7728d9f2e8f8425',
            scriptpubkey_type: 'v0_p2wpkh',
            scriptpubkey_address: 'bc1qt6alkmy9se808ls872rmwu5dnuhglpp9e5q5lj',
            value: 11173,
          },
        ],
        size: 222,
        weight: 561,
        fee: 281,
        status: {
          confirmed: true,
          block_height: CHANGE_BLOCK_HEIGHT,
          block_hash: CHANGE_BLOCK_HASH,
          block_time: 1751978539,
        },
      },
      {
        txid: '4fe35cef8765cc42c7098a10f1e39aebaee1fbb4b586dc1cd27389cc591396a3',
        version: 2,
        locktime: 903793,
        vin: [
          {
            txid: 'f5f2a0f509dc3860626a74b14e272e1d0d15e8b6465721359c0f297f1c1ec854',
            vout: 1,
            prevout: {
              scriptpubkey: '001480198104d643031fb951787d24a79c04dc5086b2',
              scriptpubkey_asm:
                'OP_0 OP_PUSHBYTES_20 80198104d643031fb951787d24a79c04dc5086b2',
              scriptpubkey_type: 'v0_p2wpkh',
              scriptpubkey_address:
                'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf',
              value: 299938,
            },
            scriptsig: '',
            scriptsig_asm: '',
            witness: [
              '304402204d203b3a9d963ffa4d90b1a1707fad6f841353d1b289493554afdb699818e2b902207cffeb48764240c68f73aa4e59821b8726ac610f22a4d61681cd5fe652c3416a01',
              '0233f916944c2d3c2024d6e4038274e8f5af0d072d08411b2fc28bea04b521387a',
            ],
            is_coinbase: false,
            sequence: 4294967293,
          },
        ],
        vout: [
          {
            scriptpubkey: '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 469d76e8387e11cbe9010c72ee4b748dd9152fa5',
            scriptpubkey_type: 'v0_p2wpkh',
            scriptpubkey_address: DEFAULT_BTC_ADDRESS,
            value: 91392,
          },
          {
            scriptpubkey: '00140e4ce9a620216a6df6b2d6326014186585c0d838',
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 0e4ce9a620216a6df6b2d6326014186585c0d838',
            scriptpubkey_type: 'v0_p2wpkh',
            scriptpubkey_address: 'bc1qpexwnf3qy94xma4j6cexq9qcvkzupkpcv3sdcp',
            value: 208265,
          },
        ],
        size: 222,
        weight: 561,
        fee: 281,
        status: {
          confirmed: true,
          block_height: FUNDING_BLOCK_HEIGHT,
          block_hash: FUNDING_BLOCK_HASH,
          block_time: 1751531455,
        },
      },
    ]);

const mockChangeTx = async (mockServer: Mockttp) =>
  mockServer
    .forGet(`${ESPLORA_URL}/scripthash/${CHANGE_SCRIPT_HASH}/txs`)
    .thenJson(200, [
      {
        txid: '67c7e6b19e0740cf577d5b9aaf1b4107474e9f41fa5360d4de1ac890f617f3d9',
        version: 2,
        locktime: 904598,
        vin: [
          {
            txid: '4fe35cef8765cc42c7098a10f1e39aebaee1fbb4b586dc1cd27389cc591396a3',
            vout: 0,
            prevout: {
              scriptpubkey: '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
              scriptpubkey_asm:
                'OP_0 OP_PUSHBYTES_20 469d76e8387e11cbe9010c72ee4b748dd9152fa5',
              scriptpubkey_type: 'v0_p2wpkh',
              scriptpubkey_address: DEFAULT_BTC_ADDRESS,
              value: 91392,
            },
            scriptsig: '',
            scriptsig_asm: '',
            witness: [
              '304402200f3fd86d09903faf976400fe14337f02e28817def6ae61d41d26f528592dd7a00220230e90e38473e9909d3cbcae075114c2d5a6bf2146e8cbbce940f5de689c1c1801',
              '02152a1eac05eee4a91226592fb65b7228f545cbc75454e31f2756def122a1f892',
            ],
            is_coinbase: false,
            sequence: 4294967293,
          },
        ],
        vout: [
          {
            scriptpubkey: '00145777b0d2f1b6c0c97e1a1f7db1848ee553d88540',
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 5777b0d2f1b6c0c97e1a1f7db1848ee553d88540',
            scriptpubkey_type: 'v0_p2wpkh',
            scriptpubkey_address: 'bc1q2ammp5h3kmqvjls6ra7mrpywu4fa3p2q2v2wh4',
            value: 79938,
          },
          {
            scriptpubkey: '00145ebbfb6c85864ef3fe07f287b7728d9f2e8f8425',
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 5ebbfb6c85864ef3fe07f287b7728d9f2e8f8425',
            scriptpubkey_type: 'v0_p2wpkh',
            scriptpubkey_address: 'bc1qt6alkmy9se808ls872rmwu5dnuhglpp9e5q5lj',
            value: 11173,
          },
        ],
        size: 222,
        weight: 561,
        fee: 281,
        status: {
          confirmed: true,
          block_height: CHANGE_BLOCK_HEIGHT,
          block_hash: CHANGE_BLOCK_HASH,
          block_time: 1751978539,
        },
      },
    ]);

const mockTxs = async (mockServer: Mockttp, scripthashes: string[]) => {
  for (const scripthash of scripthashes) {
    await mockServer
      .forGet(`${ESPLORA_URL}/scripthash/${scripthash}/txs`)
      .thenJson(200, []);
  }
};

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
  await mockBlockHeight(mockServer, 0, GENESIS_BLOCK_HASH);

  // Mock the funding transaction calls
  await mockFundingTx(mockServer);
  await mockBlockHeight(mockServer, FUNDING_BLOCK_HEIGHT, FUNDING_BLOCK_HASH);

  // Mock send transaction
  await mockChangeTx(mockServer);
  await mockBlockHeight(mockServer, CHANGE_BLOCK_HEIGHT, CHANGE_BLOCK_HASH);

  // Mock other calls to fetch txs given the stop gap (returns empty)
  await mockTxs(mockServer, [
    'd46079253e1fe44c9441e9927f3be4145e4634e1b8378cf6d5b0ebba98813216',
    '98c2bcc9358f44e43b023f7b8fbe6571441b49e45d75bad63dba2dea834f19a7',
    'ef9bb307bdb778a646c85d7392179b5ab2be02a55be209ca5ea61863214d5d4c',
    'f13348bdc7fedcef0781cbfce2ac86b75a1c20a386e9ab583f24226104d0bb0d',
  ]);

  // Mock fee estimates
  await mockFeeEstimates(mockServer);
}
