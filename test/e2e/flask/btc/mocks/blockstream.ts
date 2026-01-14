import { Mockttp } from 'mockttp';
import {
    DEFAULT_BTC_ADDRESS,
    SATS_IN_1_BTC,
    DEFAULT_BTC_FEE_RATE,
    SATS_IN_1_BTC,
  } from '../../../constants';

const BLOCKSTREAM_URL = 'https://blockstream.info';

export const mockGetUtxos = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/testnet/api/address/${DEFAULT_BTC_ADDRESS}/utxo`)
    .thenJson(200, [
      {
        txid: "9f0c516666f127a5bd10fbdab377c5aa2f9f70dbc0b90e496b80f77790db8995",
        vout: 1,
        status: {
          confirmed: true,
          block_height: 927990,
          block_hash: "000000000000000000001ca2359aac12b5b5e4830bb7725fdfe9c9c440efca8d",
          block_time: 1765815599
        },
        value: SATS_IN_1_BTC
      },
    ]);

export const mockGetBlocks = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/blocks`)
    .thenJson(200, [
      {
        id: "00000000000000000000dbca63d503f1c9b586c9040e4162ace67cd22dba6da2",
        height: 932126,
        version: 676061184,
        timestamp: Math.floor(Date.now() / 1000) - 2,
        tx_count: 2785,
        size: 1539847,
        weight: 3998296,
        merkle_root: "8660d9cea167c6f38272b3e99cba1c0aec8e9dbdb91e5a334ff859c512af62b5",
        previousblockhash: "00000000000000000000819c43506e9d147c5d914d61962c1234525f2a127434",
        mediantime: 1768314919,
        nonce: 2802138802,
        bits: 386001906,
        difficulty: 146472570619931
      }
    ]);

export const mockFeeEstimates = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/testnet/api/fee-estimates`)
    .thenJson(200, feeEstimatesResponse);

export const mockFeeEstimatesMainnet = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/fee-estimates`)
    .thenJson(200, feeEstimatesResponse);
    

export const mockScripthashTxs2 = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/scripthash/538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721/txs`)
    .thenJson(200, txsResponse);

export const mockScripthashTxs = (mockServer: Mockttp) =>
  mockServer
    .forGet(/^https:\/\/blockstream\.info\/api\/scripthash\/[0-9a-f]{64}\/txs$/u)
    .thenJson(200, []);

export const mockBlockHeight = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/block-height/932126`)
    .thenReply(200, '00000000000000000000dbca63d503f1c9b586c9040e4162ace67cd22dba6da2');

export const mockBlockHeight0 = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/block-height/0`)
    .thenReply(200, '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');

export const mockBlockHeight931551 = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/block-height/931551`)
    .thenReply(200, '00000000000000000000d2826c92edb4d7454a16da3e36a9aa9e7a3c53929bde');
    

export const mockGetUtxosMainnet = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/address/bc1qg6whd6pc0cguh6gpp3ewujm53hv32ta9hdp252/utxo`)
    .thenJson(200, [
      {
        txid: "9f0c516666f127a5bd10fbdab377c5aa2f9f70dbc0b90e496b80f77790db8995",
        vout: 1,
        status: {
          confirmed: true,
          block_height: 927990,
          block_hash: "000000000000000000001ca2359aac12b5b5e4830bb7725fdfe9c9c440efca8d",
          block_time: 1765815599
        },
        value: SATS_IN_1_BTC
      },
    ]);

export const mockGetTxHex = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/testnet/api/tx/9f0c516666f127a5bd10fbdab377c5aa2f9f70dbc0b90e496b80f77790db8995/hex`)
    .thenReply(200, '020000000001011172d24279306b1d47f1effaac95e6cad8217efa83c7883903f05c40c395a28d0d00000000fdffffff029e08000000000000160014469d76e8387e11cbe9010c72ee4b748dd9152fa50581200000000000225120ed129ee08e1badadbb4fe75f3847213479dd6b9ad2106259d5520891d97f681001407ba91bc9b9c2687255fa2d8eefd11b2863bae3deeb68e53fd48dc68ca6053e0b5eeb74d3caeeb13b6e4c163e836b28ec1927a2a0672e0f55b858609314d2a68500000000');

export const mockGetTxHexMainnet = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${BLOCKSTREAM_URL}/api/tx/9f0c516666f127a5bd10fbdab377c5aa2f9f70dbc0b90e496b80f77790db8995/hex`)
    .thenReply(200, '020000000001011172d24279306b1d47f1effaac95e6cad8217efa83c7883903f05c40c395a28d0d00000000fdffffff029e08000000000000160014469d76e8387e11cbe9010c72ee4b748dd9152fa50581200000000000225120ed129ee08e1badadbb4fe75f3847213479dd6b9ad2106259d5520891d97f681001407ba91bc9b9c2687255fa2d8eefd11b2863bae3deeb68e53fd48dc68ca6053e0b5eeb74d3caeeb13b6e4c163e836b28ec1927a2a0672e0f55b858609314d2a68500000000');


const feeEstimatesResponse = {
  10: 0.997,
  4: 10.17,
  22: 0.997,
  3: 10.17,
  19: 0.997,
  21: 0.997,
  20: 0.997,
  17: 0.997,
  12: 0.997,
  6: 10.17,
  5: 10.17,
  16: 0.997,
  24: 0.997,
  25: 0.997,
  18: 0.997,
  144: 0.997,
  1008: 0.996,
  9: 0.997,
  13: 0.997,
  14: 0.997,
  11: 0.997,
  15: 0.997,
  23: 0.997,
  504: 0.997,
  1: 10.17,
  2: 10.17,
  7: 0.997,
  8: 0.997
}

const txsResponse = [
  {
    "txid": "9f0c516666f127a5bd10fbdab377c5aa2f9f70dbc0b90e496b80f77790db8995",
    "version": 2,
    "locktime": 0,
    "vin": [
      {
        "txid": "8da295c3405cf0033988c783fa7e21d8cae695acfaeff1471d6b307942d27211",
        "vout": 13,
        "prevout": {
          "scriptpubkey": "5120ed129ee08e1badadbb4fe75f3847213479dd6b9ad2106259d5520891d97f6810",
          "scriptpubkey_asm": "OP_PUSHNUM_1 OP_PUSHBYTES_32 ed129ee08e1badadbb4fe75f3847213479dd6b9ad2106259d5520891d97f6810",
          "scriptpubkey_type": "v1_p2tr",
          "scriptpubkey_address": "bc1pa5ffacywrwk6mw60ua0ns3epx3ua66u66ggxykw42gyfrktldqgqukhx7x",
          "value": 2132529
        },
        "scriptsig": "",
        "scriptsig_asm": "",
        "witness": [
          "7ba91bc9b9c2687255fa2d8eefd11b2863bae3deeb68e53fd48dc68ca6053e0b5eeb74d3caeeb13b6e4c163e836b28ec1927a2a0672e0f55b858609314d2a685"
        ],
        "is_coinbase": false,
        "sequence": 4294967293
      }
    ],
    "vout": [
      {
        "scriptpubkey": "0014469d76e8387e11cbe9010c72ee4b748dd9152fa5",
        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 469d76e8387e11cbe9010c72ee4b748dd9152fa5",
        "scriptpubkey_type": "v0_p2wpkh",
        "scriptpubkey_address": "bc1qg6whd6pc0cguh6gpp3ewujm53hv32ta9hdp252",
        "value": 2206
      },
      {
        "scriptpubkey": "5120ed129ee08e1badadbb4fe75f3847213479dd6b9ad2106259d5520891d97f6810",
        "scriptpubkey_asm": "OP_PUSHNUM_1 OP_PUSHBYTES_32 ed129ee08e1badadbb4fe75f3847213479dd6b9ad2106259d5520891d97f6810",
        "scriptpubkey_type": "v1_p2tr",
        "scriptpubkey_address": "bc1pa5ffacywrwk6mw60ua0ns3epx3ua66u66ggxykw42gyfrktldqgqukhx7x",
        "value": 2130181
      }
    ],
    "size": 193,
    "weight": 568,
    "fee": 142,
    "status": {
      "confirmed": true,
      "block_height": 931551,
      "block_hash": "00000000000000000000d2826c92edb4d7454a16da3e36a9aa9e7a3c53929bde",
      "block_time": 1767966311
    }
  }
]