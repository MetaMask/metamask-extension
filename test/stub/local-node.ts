import { createServer, type Server } from 'http';
import { AddressInfo } from 'net';

/**
 * Lightweight in-process JSON-RPC HTTP server used by controller unit tests
 * that need an RPC endpoint reachable on `http://localhost:<port>`.
 *
 * Unit tests previously relied on Ganache. For Anvil we require the Foundry binary, that isn't installed in our unit-test environment.
 * This stub responds with hard-coded defaults for the JSON-RPC methods MetaMask's networking layers
 * so that the controllers can be instantiated without an actual EVM running.
 *
 * The stub is deliberately minimal: tests that need richer behavior should
 * mock at a higher level (e.g. via `nock` or by injecting their own provider).
 */

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number | string | null;
  method: string;
  params?: unknown[];
};

const ZERO_HASH = `0x${'0'.repeat(64)}`;
const ZERO_BLOOM = `0x${'0'.repeat(512)}`;
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

const defaultBlock = {
  number: '0x1',
  hash: ZERO_HASH,
  parentHash: ZERO_HASH,
  nonce: '0x0000000000000000',
  sha3Uncles: ZERO_HASH,
  logsBloom: ZERO_BLOOM,
  transactionsRoot: ZERO_HASH,
  stateRoot: ZERO_HASH,
  receiptsRoot: ZERO_HASH,
  miner: ZERO_ADDRESS,
  difficulty: '0x0',
  totalDifficulty: '0x0',
  extraData: '0x',
  size: '0x0',
  gasLimit: '0x0',
  gasUsed: '0x0',
  timestamp: '0x0',
  transactions: [],
  uncles: [],
  baseFeePerGas: '0x0',
};

// JSON-RPC method names are snake_case by spec, so disable naming-convention here.
/* eslint-disable @typescript-eslint/naming-convention */
const defaultResponses: Record<string, unknown> = {
  eth_chainId: '0x1',
  net_version: '1',
  eth_blockNumber: '0x1',
  eth_gasPrice: '0x1',
  eth_maxPriorityFeePerGas: '0x0',
  eth_getBalance: '0x0',
  eth_getCode: '0x',
  eth_call: '0x',
  eth_getBlockByNumber: defaultBlock,
  eth_getBlockByHash: defaultBlock,
  eth_getTransactionCount: '0x0',
  eth_estimateGas: '0x5208',
  eth_accounts: [],
  net_listening: true,
  web3_clientVersion: 'metamask-test-stub/0.0.0',
};
/* eslint-enable @typescript-eslint/naming-convention */

function handleRpc(rpc: JsonRpcRequest) {
  const result =
    rpc.method in defaultResponses ? defaultResponses[rpc.method] : null;
  return {
    jsonrpc: '2.0' as const,
    id: rpc.id ?? null,
    result,
  };
}

export class LocalNodeStub {
  #server: Server | undefined;

  #port = 8545;

  async start(opts: { port?: number } = {}): Promise<void> {
    if (typeof opts.port === 'number') {
      this.#port = opts.port;
    }

    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8') || '{}';
          const parsed = JSON.parse(body);
          const isBatch = Array.isArray(parsed);
          const responses = (isBatch ? parsed : [parsed]).map(handleRpc);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(isBatch ? responses : responses[0]));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: { code: -32700, message: 'Parse error' },
            }),
          );
        }
      });
    });
    this.#server = server;

    await new Promise<void>((resolve, reject) => {
      // Both listeners use `.once()` so they auto-detach after firing, and
      // resolve/reject are idempotent — no manual cleanup needed.
      server.once('error', reject);
      server.once('listening', () => {
        const address = server.address() as AddressInfo | null;
        if (address && typeof address === 'object') {
          this.#port = address.port;
        }
        resolve();
      });
      server.listen(this.#port, '127.0.0.1');
    });
  }

  get port(): number {
    return this.#port;
  }

  async quit(): Promise<void> {
    const server = this.#server;
    if (!server) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    this.#server = undefined;
  }
}
