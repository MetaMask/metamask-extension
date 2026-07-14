/* eslint-disable @typescript-eslint/naming-convention */
/**
 * @file node.ts — Bitcoin local node seeder
 *
 * The local node runs a native `bitcoind` in regtest mode. The
 * `@metamask/bitcoin-regtest-up` package installs the pinned Bitcoin Core
 * release and exposes the daemon binary spawned here. The class also converts
 * bitcoind RPC responses into the Esplora API shapes consumed by the Bitcoin
 * snap so tests can proxy Esplora HTTP calls to this node.
 */
import { spawn, type ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { installBitcoinRegtest } from '@metamask/bitcoin-regtest-up';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
} from '../../constants';
import {
  assertValidPort,
  getAvailablePorts,
  isTcpPortAvailable,
} from '../ports';

export const BITCOIN_LOCAL_NODE_HOST = '127.0.0.1';

const BITCOIN_WALLET_NAME = 'metamask-e2e';
const DEFAULT_BTC_SCRIPT_PUBKEY =
  '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5';
const PROCESS_OUTPUT_LIMIT = 8_000;

export type BitcoinLocalNodeOptions = {
  initialBalance?: number;
  p2pPort?: number;
  rpcPassword?: string;
  rpcPort?: number;
  rpcUser?: string;
};

type BitcoinRpcError = {
  code: number;
  message: string;
};

type BitcoinRpcResponse<TResult> = {
  error: BitcoinRpcError | null;
  result: TResult;
};

type BitcoinBlock = {
  bits: string;
  difficulty: number;
  hash: string;
  height: number;
  mediantime: number;
  merkleroot: string;
  nonce: number;
  previousblockhash?: string;
  size: number;
  time: number;
  tx: string[];
  version: number;
  weight: number;
};

type BitcoinScriptPubKey = {
  address?: string;
  asm: string;
  desc?: string;
  hex: string;
  type: string;
};

export type BitcoinVerboseTransaction = {
  blockhash?: string;
  confirmations?: number;
  fee?: number;
  hash: string;
  hex: string;
  locktime: number;
  size: number;
  time?: number;
  txid: string;
  version: number;
  vin: {
    coinbase?: string;
    sequence: number;
    scriptSig?: {
      asm: string;
      hex: string;
    };
    txid?: string;
    txinwitness?: string[];
    vout?: number;
  }[];
  vout: {
    n: number;
    scriptPubKey: BitcoinScriptPubKey;
    value: number;
  }[];
  vsize: number;
  weight: number;
};

type EsploraTransactionInput = {
  is_coinbase: boolean;
  prevout: EsploraTransactionOutput | null;
  scriptsig: string;
  scriptsig_asm: string;
  sequence: number;
  txid?: string;
  vout?: number;
  witness: string[];
};

type EsploraTransactionOutput = {
  scriptpubkey: string;
  scriptpubkey_address?: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  value: number;
};

type EsploraTransaction = {
  fee: number;
  locktime: number;
  size: number;
  status: {
    block_hash?: string;
    block_height?: number;
    block_time?: number;
    confirmed: boolean;
  };
  txid: string;
  version: number;
  vin: EsploraTransactionInput[];
  vout: EsploraTransactionOutput[];
  weight: number;
};

type EsploraUtxo = {
  status: EsploraTransaction['status'];
  txid: string;
  value: number;
  vout: number;
};

type EsploraOutspend = {
  spent: boolean;
  status?: EsploraTransaction['status'];
  txid?: string;
  vin?: number;
};

export function bitcoinToSatoshis(value: number): number {
  return Math.round(value * 100_000_000);
}

export function scriptPubKeyToScriptHash(scriptPubKey: string): string {
  return createHash('sha256')
    .update(Buffer.from(scriptPubKey, 'hex'))
    .digest('hex');
}

export function createEsploraTransaction(
  transaction: BitcoinVerboseTransaction,
  options: {
    blockHeight?: number;
    fee?: number;
    prevouts?: Map<string, EsploraTransactionOutput>;
  } = {},
): EsploraTransaction {
  const { blockHeight, fee = 0, prevouts = new Map() } = options;

  return {
    fee,
    locktime: transaction.locktime,
    size: transaction.size,
    status: {
      ...(transaction.blockhash ? { block_hash: transaction.blockhash } : {}),
      ...(blockHeight === undefined ? {} : { block_height: blockHeight }),
      ...(transaction.time ? { block_time: transaction.time } : {}),
      confirmed: Boolean(transaction.confirmations),
    },
    txid: transaction.txid,
    version: transaction.version,
    vin: transaction.vin.map((input) => {
      const prevoutKey =
        input.txid && input.vout !== undefined
          ? createOutpoint(input.txid, input.vout)
          : undefined;

      return {
        is_coinbase: Boolean(input.coinbase),
        prevout: prevoutKey ? (prevouts.get(prevoutKey) ?? null) : null,
        scriptsig: input.scriptSig?.hex ?? '',
        scriptsig_asm: input.scriptSig?.asm ?? '',
        sequence: input.sequence,
        ...(input.txid ? { txid: input.txid } : {}),
        ...(input.vout === undefined ? {} : { vout: input.vout }),
        witness: input.txinwitness ?? [],
      };
    }),
    vout: transaction.vout.map((output) =>
      createEsploraTransactionOutput(output),
    ),
    weight: transaction.weight,
  };
}

function createEsploraBlock(block: BitcoinBlock) {
  return {
    bits: Number.parseInt(block.bits, 16),
    difficulty: block.difficulty,
    height: block.height,
    id: block.hash,
    mediantime: block.mediantime,
    merkle_root: block.merkleroot,
    nonce: block.nonce,
    previousblockhash: block.previousblockhash,
    size: block.size,
    timestamp: block.time,
    tx_count: block.tx.length,
    version: block.version,
    weight: block.weight,
  };
}

function createEsploraTransactionOutput(output: {
  scriptPubKey: BitcoinScriptPubKey;
  value: number;
}): EsploraTransactionOutput {
  const { scriptPubKey } = output;
  return {
    scriptpubkey: scriptPubKey.hex,
    scriptpubkey_address:
      scriptPubKey.hex === DEFAULT_BTC_SCRIPT_PUBKEY
        ? DEFAULT_BTC_ADDRESS
        : scriptPubKey.address,
    scriptpubkey_asm: normalizeScriptPubKeyAsm(scriptPubKey),
    scriptpubkey_type: normalizeScriptPubKeyType(scriptPubKey.type),
    value: bitcoinToSatoshis(output.value),
  };
}

function createOutpoint(txid: string, vout: number): string {
  return `${txid}:${vout}`;
}

function normalizeScriptPubKeyAsm(scriptPubKey: BitcoinScriptPubKey): string {
  if (scriptPubKey.hex.startsWith('0014')) {
    return `OP_0 OP_PUSHBYTES_20 ${scriptPubKey.hex.slice(4)}`;
  }

  return scriptPubKey.asm;
}

function normalizeScriptPubKeyType(type: string): string {
  if (type === 'witness_v0_keyhash') {
    return 'v0_p2wpkh';
  }

  if (type === 'witness_v1_taproot') {
    return 'v1_p2tr';
  }

  return type;
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class BitcoinNode {
  #dataDir: string | undefined;

  #fundingTxId: string | undefined;

  #nodeProcess: ChildProcess | undefined;

  #nodeProcessExitError: Error | undefined;

  #rpcPassword = 'metamask-e2e-pass';

  #rpcPort = 18443;

  #rpcUser = 'metamask-e2e-user';

  #stderr = '';

  readonly #broadcastTxIds = new Set<string>();

  readonly #targetScriptPubKey = DEFAULT_BTC_SCRIPT_PUBKEY;

  async start(options: BitcoinLocalNodeOptions = {}): Promise<void> {
    this.#rpcUser = options.rpcUser ?? this.#rpcUser;
    this.#rpcPassword = options.rpcPassword ?? this.#rpcPassword;

    try {
      await this.#startNativeNode(options);
      await this.waitForReady();
      await this.createWallet();
      await this.fundDefaultAccount(
        options.initialBalance ?? DEFAULT_BTC_BALANCE,
      );
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async broadcastTransaction(rawTransaction: string): Promise<string> {
    const txId = await this.rpc<string>('sendrawtransaction', [rawTransaction]);
    this.#broadcastTxIds.add(txId);
    return txId;
  }

  async getBlock(blockHash: string) {
    const block = await this.rpc<BitcoinBlock>('getblock', [blockHash, 1]);
    return createEsploraBlock(block);
  }

  async getBlockHash(height: number): Promise<string> {
    return await this.rpc<string>('getblockhash', [height]);
  }

  async getBlocks(): Promise<ReturnType<typeof createEsploraBlock>[]> {
    const tipHeight = await this.getTipHeight();
    const blockCount = Math.min(tipHeight + 1, 10);
    const blocks = [];

    for (let height = tipHeight; height > tipHeight - blockCount; height--) {
      const blockHash = await this.rpc<string>('getblockhash', [height]);
      const block = await this.rpc<BitcoinBlock>('getblock', [blockHash, 1]);
      blocks.push(createEsploraBlock(block));
    }

    return blocks;
  }

  async getFeeEstimates(): Promise<Record<string, number>> {
    return {
      '1': DEFAULT_BTC_FEE_RATE,
      '2': DEFAULT_BTC_FEE_RATE,
      '3': DEFAULT_BTC_FEE_RATE,
      '4': DEFAULT_BTC_FEE_RATE,
      '6': DEFAULT_BTC_FEE_RATE,
      '10': DEFAULT_BTC_FEE_RATE,
      '144': DEFAULT_BTC_FEE_RATE,
    };
  }

  async getOutspends(txId: string): Promise<EsploraOutspend[]> {
    const transaction = await this.getVerboseTransaction(txId);

    return await Promise.all(
      transaction.vout.map(async (output) => {
        const unspent = await this.rpc<unknown>('gettxout', [
          txId,
          output.n,
          true,
        ]);
        if (unspent) {
          return { spent: false };
        }

        const spender = await this.findSpendingTransaction(txId, output.n);
        if (!spender) {
          return { spent: true };
        }

        return {
          spent: true,
          status: spender.status,
          txid: spender.txid,
          vin: spender.vin.findIndex(
            (input) => input.txid === txId && input.vout === output.n,
          ),
        };
      }),
    );
  }

  async getScriptHashTransactions(
    scriptHash: string,
  ): Promise<EsploraTransaction[]> {
    if (scriptHash !== this.targetScriptHash) {
      return [];
    }

    const txIds = [
      ...(this.#fundingTxId ? [this.#fundingTxId] : []),
      ...this.#broadcastTxIds,
    ];

    return await Promise.all(txIds.map((txId) => this.getTransaction(txId)));
  }

  async getScriptHashUtxos(scriptHash: string): Promise<EsploraUtxo[]> {
    if (scriptHash !== this.targetScriptHash || !this.#fundingTxId) {
      return [];
    }

    const txIds = [this.#fundingTxId, ...this.#broadcastTxIds];
    const utxos: EsploraUtxo[] = [];

    for (const txId of txIds) {
      const transaction = await this.getVerboseTransaction(txId);
      const matchingOutputs = transaction.vout.filter(
        (candidate) => candidate.scriptPubKey.hex === this.#targetScriptPubKey,
      );

      for (const output of matchingOutputs) {
        const unspent = await this.rpc<unknown>('gettxout', [
          txId,
          output.n,
          true,
        ]);

        if (!unspent) {
          continue;
        }

        const esploraTransaction = await this.getTransaction(txId);
        utxos.push({
          status: esploraTransaction.status,
          txid: txId,
          value: bitcoinToSatoshis(output.value),
          vout: output.n,
        });
      }
    }

    return utxos;
  }

  async getTipHash(): Promise<string> {
    const tipHeight = await this.getTipHeight();
    return await this.rpc<string>('getblockhash', [tipHeight]);
  }

  async getTipHeight(): Promise<number> {
    return await this.rpc<number>('getblockcount');
  }

  async getTransaction(txId: string): Promise<EsploraTransaction> {
    const transaction = await this.getVerboseTransaction(txId);
    const blockHeight = transaction.blockhash
      ? await this.getBlockHeight(transaction.blockhash)
      : undefined;
    const prevouts = await this.getPrevouts(transaction);
    const fee = this.calculateFee(transaction, prevouts);

    return createEsploraTransaction(transaction, {
      blockHeight,
      fee,
      prevouts,
    });
  }

  async quit(): Promise<void> {
    const nodeProcess = this.#nodeProcess;
    const dataDir = this.#dataDir;
    this.#dataDir = undefined;
    this.#nodeProcess = undefined;

    if (nodeProcess) {
      await stopProcess(nodeProcess);
    }

    if (dataDir) {
      await rm(dataDir, { force: true, recursive: true });
    }
  }

  get targetScriptHash(): string {
    return scriptPubKeyToScriptHash(this.#targetScriptPubKey);
  }

  private calculateFee(
    transaction: BitcoinVerboseTransaction,
    prevouts: Map<string, EsploraTransactionOutput>,
  ): number {
    if (transaction.vin.some((input) => input.coinbase)) {
      return 0;
    }

    const inputTotal = transaction.vin.reduce((sum, input) => {
      if (!input.txid || input.vout === undefined) {
        return sum;
      }
      return (
        sum + (prevouts.get(createOutpoint(input.txid, input.vout))?.value ?? 0)
      );
    }, 0);
    const outputTotal = transaction.vout.reduce(
      (sum, output) => sum + bitcoinToSatoshis(output.value),
      0,
    );

    return Math.max(inputTotal - outputTotal, 0);
  }

  private async createWallet(): Promise<void> {
    try {
      await this.rpc('createwallet', [
        BITCOIN_WALLET_NAME,
        false,
        false,
        '',
        false,
        true,
      ]);
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.includes('Database already exists')
        )
      ) {
        throw error;
      }
    }
  }

  private async findSpendingTransaction(
    txId: string,
    vout: number,
  ): Promise<EsploraTransaction | undefined> {
    for (const candidateTxId of this.#broadcastTxIds) {
      const transaction = await this.getTransaction(candidateTxId);
      if (
        transaction.vin.some(
          (input) => input.txid === txId && input.vout === vout,
        )
      ) {
        return transaction;
      }
    }

    return undefined;
  }

  private async fundDefaultAccount(amount: number): Promise<void> {
    const miningAddress = await this.rpc<string>(
      'getnewaddress',
      ['', 'bech32'],
      true,
    );
    await this.rpc('generatetoaddress', [101, miningAddress]);

    const decodedScript = await this.rpc<{
      address?: string;
      segwit?: { address?: string };
    }>('decodescript', [this.#targetScriptPubKey]);
    const regtestAddress =
      decodedScript.segwit?.address ?? decodedScript.address;
    if (!regtestAddress) {
      throw new Error(
        'bitcoind did not derive a regtest address for BTC script',
      );
    }

    this.#fundingTxId = await this.rpc<string>(
      'sendtoaddress',
      [regtestAddress, amount],
      true,
    );
    await this.rpc('generatetoaddress', [1, miningAddress]);
  }

  private async getBlockHeight(blockHash: string): Promise<number | undefined> {
    const block = await this.rpc<BitcoinBlock>('getblock', [blockHash, 1]);
    return block.height;
  }

  private async getPrevouts(
    transaction: BitcoinVerboseTransaction,
  ): Promise<Map<string, EsploraTransactionOutput>> {
    const prevouts = new Map<string, EsploraTransactionOutput>();

    for (const input of transaction.vin) {
      if (!input.txid || input.vout === undefined) {
        continue;
      }

      const previousTransaction = await this.getVerboseTransaction(input.txid);
      const previousOutput = previousTransaction.vout[input.vout];
      if (previousOutput) {
        prevouts.set(
          createOutpoint(input.txid, input.vout),
          createEsploraTransactionOutput(previousOutput),
        );
      }
    }

    return prevouts;
  }

  private async getVerboseTransaction(
    txId: string,
  ): Promise<BitcoinVerboseTransaction> {
    return await this.rpc<BitcoinVerboseTransaction>('getrawtransaction', [
      txId,
      true,
    ]);
  }

  private async rpc<TResult = unknown>(
    method: string,
    params: unknown[] = [],
    wallet = false,
  ): Promise<TResult> {
    const walletPath = wallet ? `/wallet/${BITCOIN_WALLET_NAME}` : '';
    const response = await fetch(
      `http://${BITCOIN_LOCAL_NODE_HOST}:${this.#rpcPort}${walletPath}`,
      {
        body: JSON.stringify({
          id: 'metamask-e2e',
          jsonrpc: '1.0',
          method,
          params,
        }),
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.#rpcUser}:${this.#rpcPassword}`,
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    const rpcResponse = (await response.json()) as BitcoinRpcResponse<TResult>;
    if (!response.ok || rpcResponse.error) {
      throw new Error(
        `bitcoind RPC ${method} failed: ${JSON.stringify(rpcResponse.error)}`,
      );
    }

    return rpcResponse.result;
  }

  private async waitForReady(timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      this.#throwIfNodeExited();

      try {
        await this.rpc('getblockchaininfo');
        return;
      } catch {
        await wait(250);
      }
    }

    throw new Error(
      `bitcoind did not become ready within ${timeoutMs}ms${
        this.#stderr ? `\nstderr:\n${this.#stderr}` : ''
      }`,
    );
  }

  async #startNativeNode(options: BitcoinLocalNodeOptions): Promise<void> {
    const { bitcoindBinary } = await installBitcoinRegtest({
      cwd: process.cwd(),
    });

    const [rpcPort, p2pPort] = await resolveNodePorts(options);
    const dataDir = await mkdtemp(join(tmpdir(), 'bitcoin-regtest-e2e-'));

    this.#dataDir = dataDir;
    this.#nodeProcessExitError = undefined;
    this.#rpcPort = rpcPort;
    this.#stderr = '';

    const nodeProcess = spawn(
      bitcoindBinary,
      [
        '-regtest',
        '-server=1',
        '-txindex=1',
        '-fallbackfee=0.00001',
        `-datadir=${dataDir}`,
        `-rpcbind=${BITCOIN_LOCAL_NODE_HOST}`,
        `-rpcallowip=${BITCOIN_LOCAL_NODE_HOST}`,
        `-rpcport=${rpcPort}`,
        `-port=${p2pPort}`,
        `-rpcuser=${this.#rpcUser}`,
        `-rpcpassword=${this.#rpcPassword}`,
      ],
      {
        cwd: dataDir,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    this.#nodeProcess = nodeProcess;
    nodeProcess.stderr?.on('data', (chunk: Buffer) => {
      this.#stderr = `${this.#stderr}${chunk.toString()}`.slice(
        -PROCESS_OUTPUT_LIMIT,
      );
    });
    nodeProcess.once('error', (error) => {
      this.#nodeProcessExitError = error;
    });
    nodeProcess.once('exit', (code, signal) => {
      this.#nodeProcessExitError = new Error(
        `bitcoind exited with code ${code ?? 'null'} and signal ${
          signal ?? 'null'
        }.${this.#stderr ? `\nstderr:\n${this.#stderr}` : ''}`,
      );
    });
  }

  #throwIfNodeExited(): void {
    if (this.#nodeProcessExitError) {
      throw this.#nodeProcessExitError;
    }
  }
}

/**
 * Resolves the RPC and P2P ports for bitcoind. Explicitly requested ports are
 * validated and checked for availability; missing ports are allocated
 * dynamically so parallel test runs do not collide on the documented
 * defaults.
 *
 * @param options - Start options possibly carrying explicit ports.
 * @returns A `[rpcPort, p2pPort]` tuple.
 */
async function resolveNodePorts(
  options: BitcoinLocalNodeOptions,
): Promise<[number, number]> {
  const explicitPorts: number[] = [];

  for (const [label, port] of [
    ['Bitcoin RPC port', options.rpcPort],
    ['Bitcoin P2P port', options.p2pPort],
  ] as const) {
    if (port === undefined) {
      continue;
    }
    assertValidPort(port, label);
    if (explicitPorts.includes(port)) {
      throw new Error(`${label} ${port} is used more than once`);
    }
    if (!(await isTcpPortAvailable(port))) {
      throw new Error(`${label} ${port} is already in use`);
    }
    explicitPorts.push(port);
  }

  const allocatedPorts = await getAvailablePorts(
    (options.rpcPort === undefined ? 1 : 0) +
      (options.p2pPort === undefined ? 1 : 0),
    explicitPorts,
  );

  return [
    options.rpcPort ?? (allocatedPorts.shift() as number),
    options.p2pPort ?? (allocatedPorts.shift() as number),
  ];
}

async function stopProcess(childProcess: ChildProcess): Promise<void> {
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return;
  }

  const exitPromise = new Promise<void>((resolvePromise) => {
    childProcess.once('exit', () => resolvePromise());
  });
  killProcessTree(childProcess, 'SIGTERM');

  const exitedAfterTerm = await Promise.race([
    exitPromise,
    new Promise<boolean>((resolvePromise) => {
      setTimeout(() => {
        resolvePromise(false);
      }, 10_000);
    }),
  ]);

  if (exitedAfterTerm !== false) {
    return;
  }

  killProcessTree(childProcess, 'SIGKILL');
  await Promise.race([
    exitPromise,
    new Promise<void>((resolvePromise) => setTimeout(resolvePromise, 1_000)),
  ]);
}

function killProcessTree(
  childProcess: ChildProcess,
  signal: NodeJS.Signals,
): void {
  if (process.platform === 'win32') {
    childProcess.kill(signal);
    return;
  }

  if (childProcess.pid) {
    try {
      process.kill(-childProcess.pid, signal);
    } catch {
      childProcess.kill(signal);
    }
  }
}
