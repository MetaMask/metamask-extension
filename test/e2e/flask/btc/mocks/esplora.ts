import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

const ESPLORA_URL = 'https://esplora.rivet.link/esplora/api';
const INFURA_BTC_MAINNET_URL_PATTERN =
  /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}$/u;

// Scripthash que el snap está buscando (derivado de alguna otra dirección del wallet)
const FUNDING_SCRIPT_HASH =
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';
// Scripthash correcto de DEFAULT_BTC_ADDRESS (bc1qg6whd6pc0cguh6gpp3ewujm53hv32ta9hdp252)
// Calculado como: SHA256(0014e181ee0b8297a94b029821d955a9d8b837bfb4a5).reverse()
const DEFAULT_ADDRESS_SCRIPT_HASH =
  '7be2e49e0c16cac7dec332d59f37b76b7bf8a6f989e127f12d0485a5c368e987';
const FUNDING_BLOCK_HEIGHT = 918175;
const FUNDING_BLOCK_HASH =
  '000000000000000000012dca96f7e4803c607e2f34d41a2a7ae8f4afb00ae1a7';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

const txsResponse = [
  {
    txid: '6a72c16054a2d4132560f26677402ac720b3b724332fb33b58ba1b93ef98e118',
    version: 2,
    locktime: 926326,
    vin: [
      {
        txid: '4a9f5c3db5c24f237341922f0964af811d9736d981b89766db8a76a5b92c7aa4',
        vout: 2,
        prevout: {
          // ✅ CORREGIDO: Esta es la dirección que GASTA
          scriptpubkey: '0014c461ef6b51c2e69a426232204a0ddf6d877c3a1a',
          scriptpubkey_asm:
            'OP_0 OP_PUSHBYTES_20 c461ef6b51c2e69a426232204a0ddf6d877c3a1a',
          scriptpubkey_type: 'v0_p2wpkh',
          scriptpubkey_address: 'bc1qc3s77663ctnf5snzxgsy5rwldkrhcws6vkultr',
          value: 1654664,
        },
        scriptsig: '',
        scriptsig_asm: '',
        witness: [
          '30440220738fcc18837a47b4fa408cbe00366411fc1aa0ba297ba9a09f22a9a043df5c9802200452ede1dc6261bdf5c56e5b0bbc8f8e37253fa72515b6ca6316b0b9c05b0ca401',
          '0370be84f37bbf9d957d2986269271267c704ff21f109e0274c7512852b45489f8',
        ],
        is_coinbase: false,
        sequence: 4294967293,
      },
      {
        txid: '7559b7bf08ca3426b3f53574f7c0ce6370b91dd63d2222213449f97775f2e51f',
        vout: 0,
        prevout: {
          // ✅ CORREGIDO: Esta es la dirección que GASTA
          scriptpubkey: '0014c461ef6b51c2e69a426232204a0ddf6d877c3a1a',
          scriptpubkey_asm:
            'OP_0 OP_PUSHBYTES_20 c461ef6b51c2e69a426232204a0ddf6d877c3a1a',
          scriptpubkey_type: 'v0_p2wpkh',
          scriptpubkey_address: 'bc1qc3s77663ctnf5snzxgsy5rwldkrhcws6vkultr',
          value: 498762,
        },
        scriptsig: '',
        scriptsig_asm: '',
        witness: [
          '30440220578c7f0a842aeed2da691c1e1f470cd76668f374b22c3030e9e8ca0d516d1236022049d368d8eab1e0fea032798be0db286677fba3f772c600d371541a9b4e8324c601',
          '0370be84f37bbf9d957d2986269271267c704ff21f109e0274c7512852b45489f8',
        ],
        is_coinbase: false,
        sequence: 4294967293,
      },
    ],
    vout: [
      {
        // Output para DEFAULT_BTC_ADDRESS (bc1qg6whd6pc0cguh6gpp3ewujm53hv32ta9hdp252)
        // Scriptpubkey = 0014 + witness_program (e181ee0b8297a94b029821d955a9d8b837bfb4a5)
        scriptpubkey: '0014e181ee0b8297a94b029821d955a9d8b837bfb4a5',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 e181ee0b8297a94b029821d955a9d8b837bfb4a5',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: DEFAULT_BTC_ADDRESS,
        value: 1600000,
      },
      {
        scriptpubkey: '0014e1b227c0fe16ab361f631697d8cc28d85ba4c69b',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 e1b227c0fe16ab361f631697d8cc28d85ba4c69b',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: 'bc1quxez0s87z64nv8mrz6ta3npgmpd6f35m9x2lts',
        value: 552800,
      },
    ],
    size: 370,
    weight: 832,
    fee: 626,
    status: {
      confirmed: true,
      block_height: 926328, // ✅ CORREGIDO: coincide con tu primer response
      block_hash:
        '00000000000000000000af0a18f490ae0d1de11da3bf441dac0da9e401f68b8d',
      block_time: 1764804442,
    },
  },
];
/* eslint-disable @typescript-eslint/naming-convention */

const mockBlocks = (mockServer: Mockttp, network?: string) => {
  console.log('[BTC MOCK] mockBlocks is being registered');
  if (!network || INFURA_BTC_MAINNET_URL_PATTERN.test(network)) {
    console.log('[BTC MOCK] mockBlocks is being called');
    return mockServer
      .forGet(
        /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/blocks$/u,
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: [
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
        ],
      }));
  }
};

const mockFundingTx = (mockServer: Mockttp) => {
  console.log(
    '[BTC MOCK] mockFundingTx is being registered for scripthashes:',
    FUNDING_SCRIPT_HASH,
    'and',
    DEFAULT_ADDRESS_SCRIPT_HASH,
  );
  return mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/scripthash\/[0-9a-f]{64}\/txs$/u,
    )
    .always()
    .thenCallback((request) => {
      // Si la URL incluye cualquiera de los scripthashes conocidos, devuelve la transacción de funding
      if (
        request.url.includes(FUNDING_SCRIPT_HASH) ||
        request.url.includes(DEFAULT_ADDRESS_SCRIPT_HASH)
      ) {
        console.log(
          '[BTC MOCK] mockFundingTx matched scripthash:',
          request.url,
        );
        return {
          statusCode: 200,
          json: txsResponse,
          /* [
            {
              txid: '6e7ebcc607a83f7cf5659fb6fb70433c775017092302630f027ca728b4d06aba',
              version: 2,
              locktime: 0,
              vin: [
                {
                  txid: '7274041ef11904e40883b4e930e1e76e69a671f6a0e4f5b7c49df06a55373b6b',
                  vout: 1,
                  prevout: {
                    scriptpubkey:
                      '001480198104d643031fb951787d24a79c04dc5086b2',
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
                // Este es el UTXO de funding: 1 BTC que recibe nuestra dirección
                {
                  scriptpubkey: '0014e181ee0b8297a94b029821d955a9d8b837bfb4a5',
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  scriptpubkey_asm:
                    'OP_0 OP_PUSHBYTES_20 e181ee0b8297a94b029821d955a9d8b837bfb4a5',
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  scriptpubkey_type: 'v0_p2wpkh',
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  scriptpubkey_address: DEFAULT_BTC_ADDRESS, // 'bc1qg6whd6pc0cguh6gpp3ewujm53hv32ta9hdp252'
                  value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC,
                },
                // Output de cambio (vuelve a la dirección original del input)
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
                  scriptpubkey_address:
                    'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf',
                  value: 346748,
                },
              ],
              size: 222,
              weight: 561,
              fee: 1428,
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
                block_time: 1759921295,
              },
            },
          ],*/
        };
      }

      // Para cualquier otro scripthash, devuelve array vacío (sin transacciones)
      console.log(
        '[BTC MOCK] mockFundingTx - scripthash not found, returning []:',
        request.url,
      );
      return {
        statusCode: 200,
        json: [],
      };
    });
};

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

const mockAddressUtxo = (mockServer: Mockttp) => {
  console.log(
    '[BTC MOCK] mockAddressUtxo is being registered for:',
    DEFAULT_BTC_ADDRESS,
  );
  return mockServer
    .forGet(
      new RegExp(
        `^https:\\/\\/bitcoin-mainnet\\.infura\\.io\\/v3\\/[a-f0-9]{32}\\/esplora\\/address\\/${DEFAULT_BTC_ADDRESS}\\/utxo$`,
        'u',
      ),
    )
    .thenCallback((request) => {
      console.log('[BTC MOCK] mockAddressUtxo matched:', request.url);
      return {
        statusCode: 200,
        json: [
          {
            txid: '6a72c16054a2d4132560f26677402ac720b3b724332fb33b58ba1b93ef98e118',
            vout: 0,
            status: {
              confirmed: true,
              block_height: 926328,
              block_hash:
                '00000000000000000000af0a18f490ae0d1de11da3bf441dac0da9e401f68b8d',
              block_time: 1764804442,
            },
            value: 1600000,
          },
        ],
      };
    });
};

/**
 * Mocks the Esplora calls needed for the initial full scan.
 * Consists of 1 transaction on the first address of the account.
 *
 * @param mockServer - The mock server
 */
export async function mockInitialFullScan(mockServer: Mockttp) {
  console.log('[BTC MOCK] mockInitialFullScan is being called');
  // Mock latest blocks
  await mockBlocks(mockServer);
  // await mockBlocks(mockServer, ESPLORA_TESTNET_URL);
  // Mock the funding transaction setting the balance to default
  await mockFundingTx(mockServer);
  // await mockFundingTx(mockServer, ESPLORA_TESTNET_URL);
  // Mock any other scripthash txs (e.g., change addresses) with empty array
  // await mockAnyTxs(mockServer);
  // Mock funding tx block hash
  await mockBlockHeight(mockServer, FUNDING_BLOCK_HEIGHT, FUNDING_BLOCK_HASH);

  // Mock genesis block hash
  await mockBlockHeight(mockServer, 0, GENESIS_BLOCK_HASH);

  // Mock fee estimates
  await mockFeeEstimates(mockServer);
  // await mockFeeEstimates(mockServer, ESPLORA_TESTNET_URL);

  // Mock address UTXOs
  await mockAddressUtxo(mockServer);
}
