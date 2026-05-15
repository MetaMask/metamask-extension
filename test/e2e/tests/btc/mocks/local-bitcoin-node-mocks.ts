import { MockedEndpoint, Mockttp } from 'mockttp';
import {
  BitcoinRegtestNode,
  type EsploraTransaction,
} from '../../../seeder/bitcoin/node';

const BITCOIN_ESPLORA_BASE_RE =
  /^https:\/\/bitcoin-(mainnet|testnet|testnet4|mutinynet|regtest)\.infura\.io\/v3\/[a-f0-9]{32}\/esplora/u;

function esploraPath(path: string): RegExp {
  return new RegExp(`${BITCOIN_ESPLORA_BASE_RE.source}${path}$`, 'u');
}

type EsploraOutspend = {
  spent: boolean;
  status?: EsploraTransaction['status'];
  txid?: string;
  vin?: number;
};

export type BitcoinFixtureBlockchainState = {
  transactionHistoryByScripthash?: Map<string, EsploraTransaction[]>;
  transactionsByTxid?: Map<string, EsploraTransaction>;
};

export async function proxyBitcoinBlockchainCalls(
  mockServer: Mockttp,
  bitcoinNode: BitcoinRegtestNode,
  fixtureState: BitcoinFixtureBlockchainState = {},
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forGet(esploraPath('/blocks'))
      .always()
      .thenCallback(async () => ({
        statusCode: 200,
        json: await bitcoinNode.getBlocks(),
      })),

    await mockServer
      .forGet(esploraPath('/blocks/tip/height'))
      .always()
      .thenCallback(async () => ({
        body: String(await bitcoinNode.getBlocksTipHeight()),
        statusCode: 200,
      })),

    await mockServer
      .forGet(esploraPath('/blocks/tip/hash'))
      .always()
      .thenCallback(async () => ({
        body: await bitcoinNode.getBlocksTipHash(),
        statusCode: 200,
      })),

    await mockServer
      .forGet(esploraPath('/block-height/(\\d+)'))
      .always()
      .thenCallback(async (req) => {
        const height = Number(req.url.match(/\/block-height\/(\d+)$/u)?.[1]);
        return {
          body: await bitcoinNode.getBlockHash(height),
          statusCode: 200,
        };
      }),

    await mockServer
      .forGet(esploraPath('/block/([0-9a-f]{64})'))
      .always()
      .thenCallback(async (req) => {
        const hash = req.url.match(/\/block\/([0-9a-f]{64})$/u)?.[1] ?? '';
        return {
          json: await bitcoinNode.getBlock(hash),
          statusCode: 200,
        };
      }),

    await mockServer
      .forGet(esploraPath('/scripthash/([0-9a-f]{64})/txs'))
      .always()
      .thenCallback(async (req) => {
        const scripthash =
          req.url.match(/\/scripthash\/([0-9a-f]{64})\/txs$/u)?.[1] ?? '';
        if (fixtureState.transactionHistoryByScripthash?.has(scripthash)) {
          return {
            json: fixtureState.transactionHistoryByScripthash.get(scripthash),
            statusCode: 200,
          };
        }

        return {
          json: await bitcoinNode.getScripthashTxs(scripthash),
          statusCode: 200,
        };
      }),

    await mockServer
      .forGet(esploraPath('/scripthash/([0-9a-f]{64})/utxo'))
      .always()
      .thenCallback(async (req) => {
        const scripthash =
          req.url.match(/\/scripthash\/([0-9a-f]{64})\/utxo$/u)?.[1] ?? '';
        return {
          json: await bitcoinNode.getScripthashUtxo(scripthash),
          statusCode: 200,
        };
      }),

    await mockServer
      .forGet(esploraPath('/tx/([0-9a-f]{64})'))
      .always()
      .thenCallback(async (req) => {
        const txid = req.url.match(/\/tx\/([0-9a-f]{64})$/u)?.[1] ?? '';
        const fixtureTransaction = fixtureState.transactionsByTxid?.get(txid);
        if (fixtureTransaction) {
          return {
            json: fixtureTransaction,
            statusCode: 200,
          };
        }

        return {
          json: await bitcoinNode.getTransaction(txid),
          statusCode: 200,
        };
      }),

    await mockServer
      .forGet(esploraPath('/tx/([0-9a-f]{64})/outspends'))
      .always()
      .thenCallback(async (req) => {
        const txid =
          req.url.match(/\/tx\/([0-9a-f]{64})\/outspends$/u)?.[1] ?? '';
        const fixtureTransaction = fixtureState.transactionsByTxid?.get(txid);
        if (fixtureTransaction) {
          return {
            json: createUnspentOutspends(fixtureTransaction),
            statusCode: 200,
          };
        }

        return {
          json: await bitcoinNode.getTxOutspends(txid),
          statusCode: 200,
        };
      }),

    await mockServer
      .forGet(esploraPath('/fee-estimates'))
      .always()
      .thenJson(200, bitcoinNode.getFeeEstimates()),

    await mockServer
      .forPost(esploraPath('/tx'))
      .always()
      .thenCallback(async (req) => {
        const rawTransaction = (await req.body.getText()) ?? '';
        return {
          body: await bitcoinNode.broadcastTransaction(rawTransaction),
          statusCode: 200,
        };
      }),
  ];
}

function createUnspentOutspends(
  transaction: EsploraTransaction,
): EsploraOutspend[] {
  return transaction.vout.map(() => ({ spent: false }));
}
