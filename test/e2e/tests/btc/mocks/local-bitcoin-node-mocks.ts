import { MockedEndpoint, Mockttp } from 'mockttp';
import { BitcoinRegtestNode } from '../../../seeder/bitcoin/node';

const BITCOIN_ESPLORA_BASE_RE =
  /^https:\/\/bitcoin-(mainnet|testnet|testnet4|mutinynet|regtest)\.infura\.io\/v3\/[a-f0-9]{32}\/esplora/u;

function esploraPath(path: string): RegExp {
  return new RegExp(`${BITCOIN_ESPLORA_BASE_RE.source}${path}$`, 'u');
}

export async function proxyBitcoinBlockchainCalls(
  mockServer: Mockttp,
  bitcoinNode: BitcoinRegtestNode,
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
        const rawTransaction = await req.body.getText();
        return {
          body: await bitcoinNode.broadcastTransaction(rawTransaction),
          statusCode: 200,
        };
      }),
  ];
}
