/* eslint-disable @typescript-eslint/naming-convention */
import { createHash } from 'crypto';
import {
  spawn,
  execFileSync,
  ChildProcessWithoutNullStreams,
} from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { AddressInfo, createServer } from 'net';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
} from '../../constants';

const BITCOIN_WALLET_NAME = 'metamask-e2e';
const DEFAULT_DOCKER_IMAGE = 'bitcoin/bitcoin:28.0';
const DEFAULT_BTC_SCRIPT_PUBKEY =
  '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5';
const MAINNET_GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

export type BitcoinLocalNodeOptions = {
  binaryPath?: string;
  dockerImage?: string;
  initialBalance?: number;
  p2pPort?: number;
  rpcPassword?: string;
  rpcPort?: number;
  rpcUser?: string;
  useDocker?: boolean;
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
      ...(blockHeight ? { block_height: blockHeight } : {}),
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

async function findAvailablePort(preferredPort?: number): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(preferredPort ?? 0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class BitcoinNode {
  #containerName: string | undefined;

  #dataDir: string | undefined;

  #fundingTxId: string | undefined;

  #process: ChildProcessWithoutNullStreams | undefined;

  #rpcPassword = 'metamask-e2e-pass';

  #rpcPort = 18443;

  #rpcUser = 'metamask-e2e-user';

  #stderr = '';

  readonly #broadcastTxIds = new Set<string>();

  readonly #targetScriptPubKey = DEFAULT_BTC_SCRIPT_PUBKEY;

  async start(options: BitcoinLocalNodeOptions = {}): Promise<void> {
    this.#rpcPort = await findAvailablePort(options.rpcPort);
    const p2pPort = await findAvailablePort(options.p2pPort);
    this.#rpcUser = options.rpcUser ?? this.#rpcUser;
    this.#rpcPassword = options.rpcPassword ?? this.#rpcPassword;

    if (options.useDocker ?? !options.binaryPath) {
      this.startDockerNode(options.dockerImage ?? DEFAULT_DOCKER_IMAGE);
    } else {
      await this.startHostNode(options.binaryPath, p2pPort);
    }

    await this.waitForReady();
    await this.createWallet();
    await this.fundDefaultAccount(
      options.initialBalance ?? DEFAULT_BTC_BALANCE,
    );
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
    if (height === 0) {
      return MAINNET_GENESIS_BLOCK_HASH;
    }

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

    const transaction = await this.getVerboseTransaction(this.#fundingTxId);
    const output = transaction.vout.find(
      (candidate) => candidate.scriptPubKey.hex === this.#targetScriptPubKey,
    );

    if (!output) {
      return [];
    }

    const unspent = await this.rpc<unknown>('gettxout', [
      this.#fundingTxId,
      output.n,
      true,
    ]);

    if (!unspent) {
      return [];
    }

    const esploraTransaction = await this.getTransaction(this.#fundingTxId);

    return [
      {
        status: esploraTransaction.status,
        txid: this.#fundingTxId,
        value: bitcoinToSatoshis(output.value),
        vout: output.n,
      },
    ];
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
    if (this.#containerName) {
      try {
        execFileSync('docker', ['rm', '-f', this.#containerName], {
          stdio: 'pipe',
        });
      } catch {
        // Already gone.
      }
    } else if (this.#process) {
      try {
        await this.rpc('stop');
      } catch {
        this.#process.kill();
      }
    }

    if (this.#dataDir) {
      await fs.rm(this.#dataDir, { force: true, recursive: true });
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

  private getNodeFailureMessage(): string | undefined {
    if (this.#process && this.#process.exitCode !== null) {
      return `bitcoind exited early: ${this.#stderr}`;
    }

    if (!this.#containerName) {
      return undefined;
    }

    try {
      const running = execFileSync(
        'docker',
        ['inspect', '-f', '{{.State.Running}}', this.#containerName],
        { encoding: 'utf8', stdio: 'pipe' },
      ).trim();
      if (running !== 'true') {
        return `Dockerized bitcoind exited early: ${this.getNodeLogs()}`;
      }
    } catch (error) {
      return `Dockerized bitcoind is unavailable: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }

    return undefined;
  }

  private getNodeLogs(): string {
    if (!this.#containerName) {
      return '';
    }

    try {
      return execFileSync('docker', ['logs', this.#containerName], {
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch {
      return '';
    }
  }

  private async rpc<TResult = unknown>(
    method: string,
    params: unknown[] = [],
    wallet = false,
  ): Promise<TResult> {
    const walletPath = wallet ? `/wallet/${BITCOIN_WALLET_NAME}` : '';
    const response = await fetch(
      `http://127.0.0.1:${this.#rpcPort}${walletPath}`,
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

  private async waitForReady(timeoutMs = 30_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const failureMessage = this.getNodeFailureMessage();
      if (failureMessage) {
        throw new Error(failureMessage);
      }

      try {
        await this.rpc('getblockchaininfo');
        return;
      } catch {
        await wait(250);
      }
    }

    throw new Error(
      `bitcoind did not become ready: ${this.getNodeLogs() || this.#stderr}`,
    );
  }

  private startDockerNode(dockerImage: string): void {
    this.#containerName = `bitcoin-regtest-e2e-${process.pid}-${Date.now()}`;

    execFileSync(
      'docker',
      [
        'run',
        '-d',
        '--rm',
        '--name',
        this.#containerName,
        '-p',
        `127.0.0.1:${this.#rpcPort}:18443`,
        dockerImage,
        '-regtest',
        '-server=1',
        '-txindex=1',
        '-fallbackfee=0.00001',
        '-rpcbind=0.0.0.0',
        '-rpcallowip=0.0.0.0/0',
        '-rpcport=18443',
        `-rpcuser=${this.#rpcUser}`,
        `-rpcpassword=${this.#rpcPassword}`,
      ],
      { stdio: 'pipe' },
    );
  }

  private async startHostNode(
    binaryPath: string,
    p2pPort: number,
  ): Promise<void> {
    execFileSync(binaryPath, ['-version'], { stdio: 'pipe' });

    this.#dataDir = await fs.mkdtemp(join(tmpdir(), 'metamask-bitcoind-'));

    this.#process = spawn(binaryPath, [
      '-regtest',
      '-server=1',
      '-txindex=1',
      '-fallbackfee=0.00001',
      `-datadir=${this.#dataDir}`,
      '-rpcbind=127.0.0.1',
      '-rpcallowip=127.0.0.1',
      `-rpcport=${this.#rpcPort}`,
      `-port=${p2pPort}`,
      `-rpcuser=${this.#rpcUser}`,
      `-rpcpassword=${this.#rpcPassword}`,
    ]);

    this.#process.stderr.on('data', (data) => {
      this.#stderr += data.toString();
    });
  }
}
