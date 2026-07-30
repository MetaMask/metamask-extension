import { Mockttp, MockedEndpoint } from 'mockttp';
import { BitcoinNode } from '../../../seeder/bitcoin/node';

const BITCOIN_ESPLORA_URL =
  /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[a-f0-9]{32}\/esplora/u;

function bitcoinEsploraPath(path: string): RegExp {
  return new RegExp(`${BITCOIN_ESPLORA_URL.source}${path}$`, 'u');
}

function getPathMatch(url: string, pattern: RegExp): string | undefined {
  return url.match(pattern)?.[1];
}

export async function proxyBitcoinBlockchainCalls(
  mockServer: Mockttp,
  bitcoinNode: BitcoinNode,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forGet(bitcoinEsploraPath('/blocks'))
      .always()
      .thenCallback(async () => ({
        json: await bitcoinNode.getBlocks(),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/blocks/tip/height'))
      .always()
      .thenCallback(async () => ({
        body: String(await bitcoinNode.getTipHeight()),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/blocks/tip/hash'))
      .always()
      .thenCallback(async () => ({
        body: await bitcoinNode.getTipHash(),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/scripthash/([0-9a-f]{64})/txs'))
      .always()
      .thenCallback(async (request) => ({
        json: await bitcoinNode.getScriptHashTransactions(
          getPathMatch(request.url, /scripthash\/([0-9a-f]{64})\/txs/u) ?? '',
        ),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/scripthash/([0-9a-f]{64})/utxo'))
      .always()
      .thenCallback(async (request) => ({
        json: await bitcoinNode.getScriptHashUtxos(
          getPathMatch(request.url, /scripthash\/([0-9a-f]{64})\/utxo/u) ?? '',
        ),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/tx/([0-9a-f]{64})'))
      .always()
      .thenCallback(async (request) => ({
        json: await bitcoinNode.getTransaction(
          getPathMatch(request.url, /\/tx\/([0-9a-f]{64})$/u) ?? '',
        ),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/tx/([0-9a-f]{64})/outspends'))
      .always()
      .thenCallback(async (request) => ({
        json: await bitcoinNode.getOutspends(
          getPathMatch(request.url, /\/tx\/([0-9a-f]{64})\/outspends/u) ?? '',
        ),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/block/([0-9a-f]{64})'))
      .always()
      .thenCallback(async (request) => ({
        json: await bitcoinNode.getBlock(
          getPathMatch(request.url, /\/block\/([0-9a-f]{64})$/u) ?? '',
        ),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/block-height/(\\d+)'))
      .always()
      .thenCallback(async (request) => ({
        body: await bitcoinNode.getBlockHash(
          Number(getPathMatch(request.url, /\/block-height\/(\d+)$/u) ?? 0),
        ),
        statusCode: 200,
      })),

    await mockServer
      .forGet(bitcoinEsploraPath('/fee-estimates'))
      .always()
      .thenCallback(async () => ({
        json: await bitcoinNode.getFeeEstimates(),
        statusCode: 200,
      })),

    await mockServer
      .forPost(bitcoinEsploraPath('/tx'))
      .always()
      .thenCallback(async (request) => ({
        body: await bitcoinNode.broadcastTransaction(
          (await request.body.getText()) ?? '',
        ),
        statusCode: 200,
      })),
  ];
}
