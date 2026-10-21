import { createHash } from 'crypto';
import { Mockttp } from 'mockttp';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../../constants';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Bitcoin address constants derived from E2E_SRP using BIP84 (P2WPKH).
 * The address is imported from constants.ts as DEFAULT_BTC_ADDRESS.
 *
 * ScriptPubKey: 0014469d76e8387e11cbe9010c72ee4b748dd9152fa5
 * Scripthash (SHA256 reversed): 538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721
 *
 * NOTE: The scriptpubkey was verified against real mainnet API response.
 */
const E2E_BTC_SCRIPTPUBKEY = '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5';
const E2E_BTC_SCRIPTHASH =
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';

/**
 * Valid transaction IDs calculated from actual serialized transaction data.
 * These are proper double-SHA256 hashes (reversed) of the transaction bytes.
 *
 * PREVOUT_TX_ID: Coinbase-like tx that funds FUNDING_TX
 * FUNDING_TX_ID: Transaction that sends 1 BTC to E2E test address
 */
const PREVOUT_TX_ID =
  '74191037a8a58e06b68d4341ac6f3b17b03a819925643143a371d103df98cdb0';
const FUNDING_TX_ID =
  '7a9d27d80e05abc2cf15c6bc87a70a6badf5f5aa6615aa8e346d92fccf7dfc10';

const FUNDING_BLOCK_HEIGHT = 932935;
const FUNDING_BLOCK_HASH =
  '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748';
const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
const DEFAULT_BROADCAST_TX_ID =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const BROADCAST_BLOCK_HEIGHT = FUNDING_BLOCK_HEIGHT + 2;
const BROADCAST_BLOCK_HASH =
  '00000000000000000002d3a19bc9dbde9d1d26b25aa49269b575282bb6d74409';
const PRE_BROADCAST_TIP_HASH =
  '00000000000000000001d3a19bc9dbde9d1d26b25aa49269b575282bb6d74409';

type EsploraTransactionOutput = {
  scriptpubkey: string;
  scriptpubkey_address?: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  value: number;
};

const E2E_FUNDING_OUTPUT: EsploraTransactionOutput = {
  scriptpubkey: E2E_BTC_SCRIPTPUBKEY,
  scriptpubkey_asm: `OP_0 OP_PUSHBYTES_20 ${E2E_BTC_SCRIPTPUBKEY.slice(4)}`,
  scriptpubkey_type: 'v0_p2wpkh',
  scriptpubkey_address: DEFAULT_BTC_ADDRESS,
  value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC,
};

type BroadcastTransaction = {
  fee: number;
  locktime: number;
  size: number;
  txid: string;
  version: number;
  vin: {
    is_coinbase: boolean;
    prevout: EsploraTransactionOutput | null;
    scriptsig: string;
    scriptsig_asm: string;
    sequence: number;
    txid: string;
    vout: number;
    witness: string[];
  }[];
  vout: EsploraTransactionOutput[];
  weight: number;
};

function readVarInt(
  buffer: Buffer,
  offset: number,
): {
  size: number;
  value: number;
} {
  const prefix = buffer[offset];
  if (prefix < 0xfd) {
    return { size: 1, value: prefix };
  }
  if (prefix === 0xfd) {
    return { size: 3, value: buffer.readUInt16LE(offset + 1) };
  }
  if (prefix === 0xfe) {
    return { size: 5, value: buffer.readUInt32LE(offset + 1) };
  }
  throw new Error('Unexpected 64-bit Bitcoin varint');
}

function getTransactionId(transactionWithoutWitness: Buffer): string {
  return createHash('sha256')
    .update(createHash('sha256').update(transactionWithoutWitness).digest())
    .digest()
    .reverse()
    .toString('hex');
}

function getScriptPubKeyDetails(scriptpubkey: string): {
  scriptpubkey_address?: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
} {
  if (scriptpubkey === E2E_BTC_SCRIPTPUBKEY) {
    return {
      scriptpubkey_address: DEFAULT_BTC_ADDRESS,
      scriptpubkey_asm: `OP_0 OP_PUSHBYTES_20 ${scriptpubkey.slice(4)}`,
      scriptpubkey_type: 'v0_p2wpkh',
    };
  }
  if (scriptpubkey.startsWith('0014') && scriptpubkey.length === 44) {
    return {
      scriptpubkey_asm: `OP_0 OP_PUSHBYTES_20 ${scriptpubkey.slice(4)}`,
      scriptpubkey_type: 'v0_p2wpkh',
    };
  }
  return {
    scriptpubkey_asm: scriptpubkey,
    scriptpubkey_type: 'unknown',
  };
}

function decodeBroadcastTransaction(
  rawTransaction: string,
): BroadcastTransaction {
  const transaction = Buffer.from(rawTransaction, 'hex');
  const hasWitness = transaction[4] === 0 && transaction[5] !== 0;
  let offset = hasWitness ? 6 : 4;
  const inputsStart = offset;
  const inputCount = readVarInt(transaction, offset);
  offset += inputCount.size;
  const vin: BroadcastTransaction['vin'] = [];
  for (let index = 0; index < inputCount.value; index += 1) {
    const txid = Buffer.from(transaction.subarray(offset, offset + 32))
      .reverse()
      .toString('hex');
    offset += 32;
    const vout = transaction.readUInt32LE(offset);
    offset += 4;
    const script = readVarInt(transaction, offset);
    offset += script.size;
    const scriptsig = transaction
      .subarray(offset, offset + script.value)
      .toString('hex');
    offset += script.value;
    const sequence = transaction.readUInt32LE(offset);
    offset += 4;
    vin.push({
      is_coinbase: false,
      prevout: txid === FUNDING_TX_ID && vout === 0 ? E2E_FUNDING_OUTPUT : null,
      scriptsig,
      scriptsig_asm: scriptsig,
      sequence,
      txid,
      vout,
      witness: [],
    });
  }

  const outputCount = readVarInt(transaction, offset);
  offset += outputCount.size;
  const vout: BroadcastTransaction['vout'] = [];
  for (let index = 0; index < outputCount.value; index += 1) {
    const value = Number(transaction.readBigUInt64LE(offset));
    offset += 8;
    const script = readVarInt(transaction, offset);
    offset += script.size;
    const scriptpubkey = transaction
      .subarray(offset, offset + script.value)
      .toString('hex');
    offset += script.value;
    vout.push({
      scriptpubkey,
      ...getScriptPubKeyDetails(scriptpubkey),
      value,
    });
  }
  const outputsEnd = offset;

  if (hasWitness) {
    for (const input of vin) {
      const witnessCount = readVarInt(transaction, offset);
      offset += witnessCount.size;
      for (let item = 0; item < witnessCount.value; item += 1) {
        const witness = readVarInt(transaction, offset);
        offset += witness.size;
        input.witness.push(
          transaction.subarray(offset, offset + witness.value).toString('hex'),
        );
        offset += witness.value;
      }
    }
  }

  const locktime = transaction.readUInt32LE(offset);
  const transactionWithoutWitness = Buffer.concat([
    transaction.subarray(0, 4),
    transaction.subarray(inputsStart, outputsEnd),
    transaction.subarray(offset, offset + 4),
  ]);
  const inputValue = vin.reduce(
    (total, input) => total + (input.prevout?.value ?? 0),
    0,
  );
  const outputValue = vout.reduce((total, output) => total + output.value, 0);

  return {
    fee: inputValue - outputValue,
    locktime,
    size: transaction.length,
    txid: getTransactionId(transactionWithoutWitness),
    version: transaction.readInt32LE(0),
    vin,
    vout,
    weight:
      transactionWithoutWitness.length * 4 +
      transaction.length -
      transactionWithoutWitness.length,
  };
}

export type BtcSendLifecycle = {
  confirm: () => void;
  getBroadcastTransaction: () => BroadcastTransaction | undefined;
  getBroadcastTxId: () => string;
  isBroadcast: () => boolean;
  isConfirmed: () => boolean;
  markBroadcast: (transaction: BroadcastTransaction) => void;
};

/**
 * Creates mutable per-test chain state for a mocked Bitcoin send lifecycle.
 *
 * @returns Controls used by the Esplora mocks and the test.
 */
export function createBtcSendLifecycle(): BtcSendLifecycle {
  let broadcastTransaction: BroadcastTransaction | undefined;
  let confirmed = false;
  return {
    confirm: () => {
      confirmed = true;
    },
    getBroadcastTransaction: () => broadcastTransaction,
    getBroadcastTxId: () =>
      broadcastTransaction?.txid ?? DEFAULT_BROADCAST_TX_ID,
    isBroadcast: () => Boolean(broadcastTransaction),
    isConfirmed: () => confirmed,
    markBroadcast: (transaction: BroadcastTransaction) => {
      broadcastTransaction = transaction;
    },
  };
}

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
      txid: PREVOUT_TX_ID,
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
  vout: [E2E_FUNDING_OUTPUT],
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

function createBroadcastTransaction(lifecycle: BtcSendLifecycle) {
  const transaction = lifecycle.getBroadcastTransaction();
  if (!transaction) {
    throw new Error('Broadcast transaction is unavailable');
  }
  return {
    ...transaction,
    status: lifecycle.isConfirmed()
      ? {
          confirmed: true,
          block_height: BROADCAST_BLOCK_HEIGHT,
          block_hash: BROADCAST_BLOCK_HASH,
          block_time: 1768825357,
        }
      : { confirmed: false },
  };
}

/**
 * Mock /blocks endpoint.
 * Returns the latest blocks for BDK chain tip sync.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockBlocks = (mockServer: Mockttp, lifecycle?: BtcSendLifecycle) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/blocks$/u,
    )
    .always()
    .thenCallback(() => {
      console.log('[BTC MOCK] /blocks endpoint called');
      const confirmedBroadcastBlock = lifecycle?.isConfirmed()
        ? [
            {
              id: BROADCAST_BLOCK_HASH,
              height: BROADCAST_BLOCK_HEIGHT,
              version: 1073676288,
              timestamp: 1768825357,
              tx_count: 1,
              size: 141,
              weight: 561,
              merkle_root: lifecycle?.getBroadcastTxId(),
              previousblockhash: PRE_BROADCAST_TIP_HASH,
              mediantime: 1768825157,
              nonce: 1,
              bits: 386001906,
              difficulty: 146472570619930.78,
            },
          ]
        : [];
      return {
        statusCode: 200,
        json: [
          ...confirmedBroadcastBlock,
          {
            id: PRE_BROADCAST_TIP_HASH,
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
 * @param lifecycle
 */
const mockAllScriptHashTxs = (
  mockServer: Mockttp,
  lifecycle?: BtcSendLifecycle,
) =>
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
        if (lifecycle?.isBroadcast()) {
          return {
            statusCode: 200,
            json: [createBroadcastTransaction(lifecycle), FUNDING_TX],
          };
        }
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
 * Mock scripthash/{hash}/utxo requests.
 * Returns the UTXO for the E2E test address.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockScriptHashUtxo = (
  mockServer: Mockttp,
  lifecycle?: BtcSendLifecycle,
) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/scripthash\/[0-9a-f]{64}\/utxo$/u,
    )
    .always()
    .thenCallback((request) => {
      const scripthashMatch = request.url.match(
        /scripthash\/([a-f0-9]{64})\/utxo/u,
      );
      const scripthash = scripthashMatch?.[1];

      if (scripthash === E2E_BTC_SCRIPTHASH) {
        if (lifecycle?.isBroadcast()) {
          const transaction = createBroadcastTransaction(lifecycle);
          const walletOutputs = transaction.vout
            .map((output, index) => ({ index, output }))
            .filter(
              ({ output }) => output.scriptpubkey === E2E_BTC_SCRIPTPUBKEY,
            );
          return {
            statusCode: 200,
            json: walletOutputs.map(({ index, output }) => ({
              txid: lifecycle.getBroadcastTxId(),
              vout: index,
              status: transaction.status,
              value: output.value,
            })),
          };
        }
        return {
          statusCode: 200,
          json: [
            {
              txid: FUNDING_TX_ID,
              vout: 0,
              status: {
                confirmed: true,
                block_height: FUNDING_BLOCK_HEIGHT,
                block_hash: FUNDING_BLOCK_HASH,
                block_time: 1768824955,
              },
              value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC,
            },
          ],
        };
      }

      return { statusCode: 200, json: [] };
    });

/**
 * The input transaction that FUNDING_TX spends from.
 * This is a coinbase-like transaction needed so BDK can validate the transaction chain.
 */
const PREVOUT_TX = {
  txid: PREVOUT_TX_ID,
  version: 2,
  locktime: 0,
  vin: [
    {
      txid: '0000000000000000000000000000000000000000000000000000000000000000',
      vout: 4294967295,
      prevout: null,
      scriptsig: '03936b0e',
      scriptsig_asm: 'OP_PUSHBYTES_3 936b0e',
      is_coinbase: true,
      sequence: 4294967295,
    },
  ],
  vout: [
    {
      scriptpubkey: '00140000000000000000000000000000000000000000',
      scriptpubkey_asm:
        'OP_0 OP_PUSHBYTES_20 0000000000000000000000000000000000000000',
      scriptpubkey_type: 'v0_p2wpkh',
      scriptpubkey_address: 'bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9e75rs',
      value: 50000000,
    },
    {
      scriptpubkey: '0014a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      scriptpubkey_asm:
        'OP_0 OP_PUSHBYTES_20 a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      scriptpubkey_type: 'v0_p2wpkh',
      scriptpubkey_address: 'bc1q5xkv868t06f78yaxpu722adv2aul0gdcz3e3mw',
      value: DEFAULT_BTC_BALANCE * SATS_IN_1_BTC + 1000,
    },
  ],
  size: 117,
  weight: 357,
  fee: 0,
  status: {
    confirmed: true,
    block_height: FUNDING_BLOCK_HEIGHT - 100,
    block_hash:
      '0000000000000000000000000000000000000000000000000000000000000001',
    block_time: 1768824000,
  },
};

/**
 * Mock transaction details endpoint.
 * Required by BDK to fetch full transaction data.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockTxDetails = (mockServer: Mockttp, lifecycle?: BtcSendLifecycle) =>
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

      if (txid === PREVOUT_TX_ID) {
        console.log(`[BTC MOCK] ✓ Returning PREVOUT_TX details`);
        return { statusCode: 200, json: PREVOUT_TX };
      }

      if (
        lifecycle &&
        txid === lifecycle.getBroadcastTxId() &&
        lifecycle.isBroadcast()
      ) {
        return {
          statusCode: 200,
          json: createBroadcastTransaction(lifecycle),
        };
      }

      console.log(`[BTC MOCK] ⚠️ Unknown txid - returning 404`);
      return { statusCode: 404, body: 'Transaction not found' };
    });

/**
 * Mock block details endpoint.
 * Required by BDK to fetch block information.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockBlockDetails = (mockServer: Mockttp, lifecycle?: BtcSendLifecycle) =>
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

      if (blockHash === BROADCAST_BLOCK_HASH && lifecycle?.isConfirmed()) {
        return {
          statusCode: 200,
          json: {
            id: BROADCAST_BLOCK_HASH,
            height: BROADCAST_BLOCK_HEIGHT,
            version: 1073676288,
            timestamp: 1768825357,
            tx_count: 1,
            size: 141,
            weight: 561,
            merkle_root: lifecycle.getBroadcastTxId(),
            previousblockhash: PRE_BROADCAST_TIP_HASH,
            mediantime: 1768825157,
            nonce: 1,
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
 * @param lifecycle
 */
const mockBlockHeight = (mockServer: Mockttp, lifecycle?: BtcSendLifecycle) =>
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

      if (
        height === String(BROADCAST_BLOCK_HEIGHT) &&
        lifecycle?.isConfirmed()
      ) {
        return { statusCode: 200, body: BROADCAST_BLOCK_HASH };
      }

      // Return a generic hash for other heights
      return {
        statusCode: 200,
        body: '0000000000000000000000000000000000000000000000000000000000000000',
      };
    });

/**
 * Mock fee-estimates endpoint.
 * Returns fee rates for transaction building.
 *
 * @param mockServer - The mock server instance
 */
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
 * Mock transaction outspends endpoint.
 * Returns spending status of transaction outputs.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockTxOutspends = (mockServer: Mockttp, lifecycle?: BtcSendLifecycle) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/tx\/[a-f0-9]{64}\/outspends$/u,
    )
    .always()
    .thenCallback((request) => {
      const txidMatch = request.url.match(/\/tx\/([a-f0-9]{64})\/outspends/u);
      const txid = txidMatch?.[1];

      if (txid === FUNDING_TX_ID) {
        if (lifecycle?.isBroadcast()) {
          return {
            statusCode: 200,
            json: [
              {
                spent: true,
                txid: lifecycle.getBroadcastTxId(),
                vin: 0,
                status: createBroadcastTransaction(lifecycle).status,
              },
            ],
          };
        }
        return {
          statusCode: 200,
          json: [{ spent: false }],
        };
      }

      if (txid === PREVOUT_TX_ID) {
        return {
          statusCode: 200,
          json: [
            { spent: false },
            {
              spent: true,
              txid: FUNDING_TX_ID,
              vin: 0,
              status: {
                confirmed: true,
                block_height: FUNDING_BLOCK_HEIGHT,
                block_hash: FUNDING_BLOCK_HASH,
                block_time: 1768824955,
              },
            },
          ],
        };
      }

      return { statusCode: 200, json: [] };
    });

/**
 * Mock POST /tx endpoint for broadcasting transactions.
 * Returns a fake txid on success.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockBroadcastTx = (mockServer: Mockttp, lifecycle?: BtcSendLifecycle) =>
  mockServer
    .forPost(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/tx$/u,
    )
    .always()
    .thenCallback(async (request) => {
      const rawTransaction = (await request.body.getText()) ?? '';
      const transaction = decodeBroadcastTransaction(rawTransaction);
      lifecycle?.markBroadcast(transaction);
      return {
        statusCode: 200,
        body: transaction.txid,
      };
    });

/**
 * Mock /blocks/tip/height endpoint.
 * Returns the current chain tip height.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockBlocksTipHeight = (
  mockServer: Mockttp,
  lifecycle?: BtcSendLifecycle,
) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/blocks\/tip\/height$/u,
    )
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: String(
          lifecycle?.isConfirmed() ? BROADCAST_BLOCK_HEIGHT : 932936,
        ),
      };
    });

/**
 * Mock /blocks/tip/hash endpoint.
 * Returns the current chain tip hash.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
const mockBlocksTipHash = (mockServer: Mockttp, lifecycle?: BtcSendLifecycle) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/blocks\/tip\/hash$/u,
    )
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: lifecycle?.isConfirmed()
          ? BROADCAST_BLOCK_HASH
          : PRE_BROADCAST_TIP_HASH,
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
      const path = request.url.replace(/.*\/esplora/u, '/esplora');

      if (path.includes('/txs')) {
        return { statusCode: 200, json: [] };
      }
      if (path.includes('/utxo')) {
        return { statusCode: 200, json: [] };
      }

      return { statusCode: 404, body: 'Not mocked' };
    });

/**
 * Mocks the Esplora API calls for Bitcoin E2E tests.
 *
 * This mock is configured for the deterministic Bitcoin address derived from E2E_SRP:
 * - Address: bc1qg6whd6pc0cguh6gpp3ewujm53hv32ta9hdp252
 * - Scripthash: 538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721
 *
 * The mock returns a funding transaction with DEFAULT_BTC_BALANCE (1 BTC) for this address.
 *
 * @param mockServer - The mock server instance
 * @param lifecycle
 */
export async function mockInitialFullScan(
  mockServer: Mockttp,
  lifecycle?: BtcSendLifecycle,
) {
  // Mock latest blocks - required by BDK for chain tip
  await mockBlocks(mockServer, lifecycle);

  await mockBlocksTipHeight(mockServer, lifecycle);
  await mockBlocksTipHash(mockServer, lifecycle);
  // Mock scripthash/*/txs - returns FUNDING_TX for E2E address
  await mockAllScriptHashTxs(mockServer, lifecycle);

  // Mock transaction details - required by BDK
  await mockTxDetails(mockServer, lifecycle);
  await mockScriptHashUtxo(mockServer, lifecycle);

  // Mock block details - required by BDK
  await mockTxOutspends(mockServer, lifecycle);
  await mockBlockDetails(mockServer, lifecycle);

  // Mock block height lookups - required by BDK
  await mockBlockHeight(mockServer, lifecycle);

  // Mock fee estimates - required for transaction building
  await mockFeeEstimates(mockServer);

  // Catch-all for debugging
  await mockBroadcastTx(mockServer, lifecycle);
  await mockCatchAllBitcoin(mockServer);
}

const mockEmptyScriptHashTxs = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/scripthash\/[0-9a-f]{64}\/txs$/u,
    )
    .always()
    .thenJson(200, []);

const mockEmptyScriptHashUtxo = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora\/scripthash\/[0-9a-f]{64}\/utxo$/u,
    )
    .always()
    .thenJson(200, []);

/**
 * Variant of mockInitialFullScan that returns an empty wallet for the E2E
 * Bitcoin address (no txs, no UTXOs). Used to exercise the empty-balance flow.
 *
 * @param mockServer - The mock server instance
 */
export async function mockEmptyInitialFullScan(mockServer: Mockttp) {
  await mockBlocks(mockServer);
  await mockBlocksTipHeight(mockServer);
  await mockBlocksTipHash(mockServer);
  await mockEmptyScriptHashTxs(mockServer);
  await mockEmptyScriptHashUtxo(mockServer);
  await mockBlockDetails(mockServer);
  await mockBlockHeight(mockServer);
  await mockFeeEstimates(mockServer);
  await mockBroadcastTx(mockServer);
  await mockCatchAllBitcoin(mockServer);
}
