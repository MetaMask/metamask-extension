/* eslint-disable @typescript-eslint/naming-convention */
import { spawn, type ChildProcess } from 'child_process';
import { mkdir, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_FEE_RATE,
  SATS_IN_1_BTC,
} from '../../constants';
import {
  assertValidPort,
  getAvailablePorts,
  isTcpPortAvailable,
} from '../ports';

const BITCOIN_NODE_PROCESS_OUTPUT_LIMIT = 8_000;
const BITCOIN_RPC_PASSWORD = 'metamask';
const BITCOIN_RPC_USER = 'metamask';
const BITCOIN_WALLET_NAME = 'e2e';
const E2E_BTC_SCRIPTPUBKEY = '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5';
const E2E_BTC_SCRIPTHASH =
  '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721';
const E2E_BTC_REGTEST_ADDRESS = 'bcrt1qg6whd6pc0cguh6gpp3ewujm53hv32ta9lzr5cs';
const MAINNET_COMPAT_GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
const MAINNET_COMPAT_FUNDING_BLOCK_HASH =
  '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748';
// Keep heights aligned with the local regtest chain so snap-built locktimes
// remain final when bitcoind accepts the broadcast.
const MAINNET_COMPAT_FUNDING_BLOCK_HEIGHT = 102;
const MAINNET_COMPAT_TIP_BLOCK_HASH =
  '00000000000000000001d3a19bc9dbde9d1d26b25aa49269b575282bb6d74409';
const MAINNET_COMPAT_TIP_BLOCK_HEIGHT = 103;
const MAINNET_COMPAT_BLOCKS: EsploraBlock[] = [
  {
    bits: 386001906,
    difficulty: 146472570619930.78,
    height: MAINNET_COMPAT_TIP_BLOCK_HEIGHT,
    id: MAINNET_COMPAT_TIP_BLOCK_HASH,
    mediantime: 1768823212,
    merkle_root:
      '68b04e69caac6a24c585e8a357fd9a5de8b084bda8b043690efaafcd11343c2a',
    nonce: 1426240500,
    previousblockhash: MAINNET_COMPAT_FUNDING_BLOCK_HASH,
    size: 2006326,
    timestamp: 1768825157,
    tx_count: 1104,
    version: 1073676288,
    weight: 3993304,
  },
  {
    bits: 386001906,
    difficulty: 146472570619930.78,
    height: MAINNET_COMPAT_FUNDING_BLOCK_HEIGHT,
    id: MAINNET_COMPAT_FUNDING_BLOCK_HASH,
    mediantime: 1768823066,
    merkle_root:
      'd7ee3bf9abfd65a43de37042f52a889e68634c0332af467d90c2e1997d230888',
    nonce: 1134465253,
    previousblockhash:
      '00000000000000000000b64f4ad246c16dfcbb1e9a236639b4d1f256c9a4450c',
    size: 1772079,
    timestamp: 1768824955,
    tx_count: 3161,
    version: 536870912,
    weight: 3993186,
  },
  {
    bits: 386001906,
    difficulty: 146472570619930.78,
    height: MAINNET_COMPAT_FUNDING_BLOCK_HEIGHT - 1,
    id: '00000000000000000000b64f4ad246c16dfcbb1e9a236639b4d1f256c9a4450c',
    mediantime: 1768822914,
    merkle_root:
      'df3cf13108177ebb597b25621dee2e4f744e51431a9f8f1753426a98556adf8e',
    nonce: 2221686570,
    previousblockhash:
      '00000000000000000001c14fa551c91c6814c2af56055d59c9bbee5b18ba752f',
    size: 390396,
    timestamp: 1768824375,
    tx_count: 1075,
    version: 609419264,
    weight: 990633,
  },
];

export type BitcoinRegtestLocalNodeOptions = {
  initialBalances?: Record<string, number>;
  ports?: {
    rpcPort?: number;
  };
};

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

type BitcoinRpcResponse<ResponseBody> = {
  error?: { code: number; message: string };
  result?: ResponseBody;
};

type BitcoinCoreBlock = {
  bits: string;
  difficulty: number;
  hash: string;
  height: number;
  mediantime: number;
  merkleroot: string;
  nextblockhash?: string;
  nonce: number;
  nTx: number;
  previousblockhash?: string;
  size: number;
  time: number;
  tx?: string[];
  version: number;
  weight: number;
};

type BitcoinCoreRawTransaction = {
  blockhash?: string;
  blocktime?: number;
  hash: string;
  locktime: number;
  size: number;
  time?: number;
  txid: string;
  version: number;
  vin: BitcoinCoreInput[];
  vout: BitcoinCoreOutput[];
  vsize?: number;
  weight?: number;
};

type BitcoinCoreInput = {
  coinbase?: string;
  scriptSig?: {
    asm: string;
    hex: string;
  };
  sequence: number;
  txid?: string;
  txinwitness?: string[];
  vout?: number;
};

type BitcoinCoreOutput = {
  n: number;
  scriptPubKey: {
    address?: string;
    asm: string;
    desc?: string;
    hex: string;
    type: string;
  };
  value: number;
};

type EsploraBlock = {
  bits: number;
  difficulty: number;
  height: number;
  id: string;
  mediantime: number;
  merkle_root: string;
  nonce: number;
  previousblockhash?: string;
  size: number;
  timestamp: number;
  tx_count: number;
  version: number;
  weight: number;
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
  vin: EsploraInput[];
  vout: EsploraOutput[];
  weight: number;
};

type EsploraInput = {
  is_coinbase: boolean;
  prevout: EsploraOutput | null;
  scriptsig: string;
  scriptsig_asm: string;
  sequence: number;
  txid: string;
  vout: number;
  witness: string[];
};

type EsploraOutput = {
  scriptpubkey: string;
  scriptpubkey_address?: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  value: number;
};

type FundingOutpoint = {
  scripthash: string;
  txid: string;
  value: number;
  vout: number;
};

export class BitcoinRegtestNode {
  #blockHeaderCache = new Map<string, BitcoinCoreBlock>();

  #fundingOutpoints = new Map<string, FundingOutpoint>();

  #nodeProcess: ChildProcess | undefined;

  #nodeProcessExitError: Error | undefined;

  #rpcPort: number | undefined;

  #runtimeDirectory: string | undefined;

  #stderr = '';

  #stdout = '';

  get baseUrl(): string {
    if (!this.#rpcPort) {
      throw new Error('Bitcoin regtest node has not started');
    }
    return `http://127.0.0.1:${this.#rpcPort}`;
  }

  async start(options: BitcoinRegtestLocalNodeOptions = {}): Promise<void> {
    try {
      await this.#startNativeBitcoinNode(options.ports);
      await this.waitForReady(120_000);
      await this.#initializeFunding(
        options.initialBalances ?? {
          [DEFAULT_BTC_ADDRESS]: DEFAULT_BTC_BALANCE,
        },
      );
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async #startNativeBitcoinNode(
    ports: BitcoinRegtestLocalNodeOptions['ports'] = {},
  ): Promise<void> {
    await this.#runPackageBinary('bitcoin-regtest-up', ['install']);

    const runtimeDirectory = await mkdtemp(join(tmpdir(), 'bitcoin-e2e-'));
    const { rpcPort } = await resolveBitcoinRegtestPorts(ports);
    await mkdir(runtimeDirectory, { recursive: true });

    this.#runtimeDirectory = runtimeDirectory;
    this.#rpcPort = rpcPort;
    this.#nodeProcessExitError = undefined;
    this.#stderr = '';
    this.#stdout = '';

    const bitcoindBinary = getPackageBinaryPath('bitcoind');
    // bitcoind brings up one listener here: RPC (`rpcPort`, exposed as
    // `baseUrl`). P2P and onion listeners are disabled so parallel E2E runs
    // don't need to reserve hidden ports like the default onion `port + 1`.
    const nodeProcess = spawn(
      bitcoindBinary,
      [
        '-regtest',
        '-server',
        `-datadir=${runtimeDirectory}`,
        '-listen=0',
        '-listenonion=0',
        `-rpcport=${rpcPort}`,
        '-rpcbind=127.0.0.1',
        '-rpcallowip=127.0.0.1',
        `-rpcuser=${BITCOIN_RPC_USER}`,
        `-rpcpassword=${BITCOIN_RPC_PASSWORD}`,
        '-fallbackfee=0.00001',
        '-txindex=1',
        '-printtoconsole',
      ],
      {
        cwd: runtimeDirectory,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    this.#nodeProcess = nodeProcess;
    nodeProcess.stdout?.on('data', (chunk: Buffer) => {
      this.#stdout = appendProcessOutput(this.#stdout, chunk);
    });
    nodeProcess.stderr?.on('data', (chunk: Buffer) => {
      this.#stderr = appendProcessOutput(this.#stderr, chunk);
    });
    nodeProcess.once('error', (error) => {
      this.#nodeProcessExitError = error;
    });
    nodeProcess.once('exit', (code, signal) => {
      this.#nodeProcessExitError = new Error(
        `bitcoind exited with code ${code ?? 'null'} and signal ${
          signal ?? 'null'
        }.${this.#formatProcessOutput()}`,
      );
    });
  }

  async #initializeFunding(initialBalances: Record<string, number>) {
    await this.#createWallet();
    const miningAddress = await this.#runBitcoinCli(
      ['-rpcwallet=e2e', 'getnewaddress'],
      { trimStdout: true },
    );
    await this.#runBitcoinCli(['generatetoaddress', '101', miningAddress]);

    for (const [address, balanceBtc] of Object.entries(initialBalances)) {
      if (balanceBtc <= 0) {
        continue;
      }

      const regtestAddress = getRegtestAddressForFunding(address);
      const scripthash = getScripthashForAddress(address);
      const txid = await this.#runBitcoinCli(
        [
          '-rpcwallet=e2e',
          'sendtoaddress',
          regtestAddress,
          balanceBtc.toString(),
        ],
        { trimStdout: true },
      );
      await this.#runBitcoinCli(['generatetoaddress', '6', miningAddress]);

      const tx = await this.#rpc<BitcoinCoreRawTransaction>(
        'getrawtransaction',
        [txid, true],
      );
      const outputIndex = tx.vout.findIndex(
        (output) => output.scriptPubKey.hex === E2E_BTC_SCRIPTPUBKEY,
      );

      if (outputIndex === -1) {
        throw new Error(
          `Funding transaction ${txid} did not contain ${address}`,
        );
      }

      this.#fundingOutpoints.set(scripthash, {
        scripthash,
        txid,
        value: btcToSats(tx.vout[outputIndex].value),
        vout: outputIndex,
      });
    }
  }

  async #createWallet(): Promise<void> {
    try {
      await this.#runBitcoinCli(['createwallet', BITCOIN_WALLET_NAME]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Database already exists')) {
        throw error;
      }
      await this.#runBitcoinCli(['loadwallet', BITCOIN_WALLET_NAME]);
    }
  }

  async #runPackageBinary(command: string, args: string[]): Promise<void> {
    const binaryPath = getPackageBinaryPath(command);

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child = spawn(binaryPath, args, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout = appendProcessOutput(stdout, chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr = appendProcessOutput(stderr, chunk);
      });
      child.once('error', rejectPromise);
      child.once('close', (code, signal) => {
        if (code === 0) {
          resolvePromise();
          return;
        }

        rejectPromise(
          new Error(
            `${command} ${args.join(' ')} exited with code ${
              code ?? 'null'
            } and signal ${signal ?? 'null'}.${formatProcessOutput(
              stdout,
              stderr,
            )}`,
          ),
        );
      });
    });
  }

  async #runBitcoinCli(
    args: string[],
    { trimStdout = false }: { trimStdout?: boolean } = {},
  ): Promise<string> {
    const binaryPath = getPackageBinaryPath('bitcoin-cli');
    const runtimeDirectory = this.#runtimeDirectory;
    const rpcPort = this.#rpcPort;

    if (!runtimeDirectory || !rpcPort) {
      throw new Error('Bitcoin regtest node has not started');
    }

    return await new Promise<string>((resolvePromise, rejectPromise) => {
      const child = spawn(
        binaryPath,
        [
          '-regtest',
          `-datadir=${runtimeDirectory}`,
          `-rpcport=${rpcPort}`,
          `-rpcuser=${BITCOIN_RPC_USER}`,
          `-rpcpassword=${BITCOIN_RPC_PASSWORD}`,
          ...args,
        ],
        {
          cwd: runtimeDirectory,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout = appendProcessOutput(stdout, chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr = appendProcessOutput(stderr, chunk);
      });
      child.once('error', rejectPromise);
      child.once('close', (code, signal) => {
        if (code === 0) {
          resolvePromise(trimStdout ? stdout.trim() : stdout);
          return;
        }

        rejectPromise(
          new Error(
            `bitcoin-cli ${args.join(' ')} exited with code ${
              code ?? 'null'
            } and signal ${signal ?? 'null'}.${formatProcessOutput(
              stdout,
              stderr,
            )}`,
          ),
        );
      });
    });
  }

  async #rpc<ResponseBody>(
    method: string,
    params: unknown[] = [],
  ): Promise<ResponseBody> {
    const response = await fetchJson<BitcoinRpcResponse<ResponseBody>>(
      this.baseUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${BITCOIN_RPC_USER}:${BITCOIN_RPC_PASSWORD}`,
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'e2e',
          jsonrpc: '1.0',
          method,
          params,
        }),
      },
    );

    if (response.error) {
      throw new Error(
        `Bitcoin RPC ${method} failed: ${response.error.message}`,
      );
    }

    return response.result as ResponseBody;
  }

  async quit(): Promise<void> {
    const nodeProcess = this.#nodeProcess;
    const runtimeDirectory = this.#runtimeDirectory;
    this.#nodeProcess = undefined;
    this.#runtimeDirectory = undefined;
    this.#rpcPort = undefined;
    this.#fundingOutpoints.clear();
    this.#blockHeaderCache.clear();

    if (nodeProcess) {
      await stopProcess(nodeProcess);
    }

    if (runtimeDirectory) {
      await removeRuntimeDirectory(runtimeDirectory);
    }
  }

  async waitForReady(timeoutMs = 60_000): Promise<void> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (this.#nodeProcessExitError) {
        throw this.#nodeProcessExitError;
      }

      try {
        await this.#rpc('getblockchaininfo');
        return;
      } catch {
        // The RPC port opens before bitcoind is fully ready.
      }

      await delay(500);
    }

    throw new Error(
      `Timed out waiting for bitcoind to start.${this.#formatProcessOutput()}`,
    );
  }

  async getBlocks(count = 10): Promise<EsploraBlock[]> {
    return MAINNET_COMPAT_BLOCKS.slice(0, count);
  }

  async getBlocksTipHeight(): Promise<number> {
    return MAINNET_COMPAT_TIP_BLOCK_HEIGHT;
  }

  async getBlocksTipHash(): Promise<string> {
    return MAINNET_COMPAT_TIP_BLOCK_HASH;
  }

  async getBlockHash(height: number): Promise<string> {
    if (height === 0) {
      return MAINNET_COMPAT_GENESIS_BLOCK_HASH;
    }

    const block = MAINNET_COMPAT_BLOCKS.find(
      ({ height: blockHeight }) => blockHeight === height,
    );
    if (block) {
      return block.id;
    }

    return await this.#rpc<string>('getblockhash', [height]);
  }

  async getBlock(hash: string): Promise<EsploraBlock> {
    const block = MAINNET_COMPAT_BLOCKS.find(({ id }) => id === hash);
    if (block) {
      return block;
    }

    return transformBlock(await this.#getBlockHeader(hash));
  }

  async getScripthashTxs(scripthash: string): Promise<EsploraTransaction[]> {
    const fundingOutpoint = this.#fundingOutpoints.get(scripthash);
    if (!fundingOutpoint) {
      return [];
    }

    return [await this.getTransaction(fundingOutpoint.txid)];
  }

  async getScripthashUtxo(scripthash: string) {
    const fundingOutpoint = this.#fundingOutpoints.get(scripthash);
    if (!fundingOutpoint) {
      return [];
    }

    const txout = await this.#rpc<null | { confirmations: number }>(
      'gettxout',
      [fundingOutpoint.txid, fundingOutpoint.vout, true],
    );

    if (!txout) {
      return [];
    }

    const fundingTx = await this.getTransaction(fundingOutpoint.txid);
    return [
      {
        status: fundingTx.status,
        txid: fundingOutpoint.txid,
        value: fundingOutpoint.value,
        vout: fundingOutpoint.vout,
      },
    ];
  }

  async getTransaction(txid: string): Promise<EsploraTransaction> {
    const transaction = await this.#rpc<BitcoinCoreRawTransaction>(
      'getrawtransaction',
      [txid, true],
    );
    return await this.#transformTransaction(transaction);
  }

  async getTxOutspends(txid: string) {
    const transaction = await this.getTransaction(txid);
    const outspends = transaction.vout.map(() => ({ spent: false }));
    const mempoolTxids = await this.#rpc<string[]>('getrawmempool');

    for (const mempoolTxid of mempoolTxids) {
      const mempoolTx = await this.getTransaction(mempoolTxid);
      for (const [vinIndex, input] of mempoolTx.vin.entries()) {
        if (input.txid === txid) {
          outspends[input.vout] = {
            spent: true,
            status: mempoolTx.status,
            txid: mempoolTxid,
            vin: vinIndex,
          };
        }
      }
    }

    return outspends;
  }

  async broadcastTransaction(rawTransaction: string): Promise<string> {
    return await this.#rpc<string>('sendrawtransaction', [rawTransaction]);
  }

  getFeeEstimates(): Record<string, number> {
    return {
      '1': DEFAULT_BTC_FEE_RATE,
      '2': DEFAULT_BTC_FEE_RATE,
      '3': DEFAULT_BTC_FEE_RATE,
      '4': 1.308,
      '5': 1.308,
      '6': 1.075,
      '10': 1.075,
      '144': 1.075,
      '504': 1.023,
      '1008': 1.023,
    };
  }

  async #getBlockHeader(hash: string): Promise<BitcoinCoreBlock> {
    const cached = this.#blockHeaderCache.get(hash);
    if (cached) {
      return cached;
    }

    const block = await this.#rpc<BitcoinCoreBlock>('getblock', [hash, 1]);
    this.#blockHeaderCache.set(hash, block);
    return block;
  }

  async #transformTransaction(
    transaction: BitcoinCoreRawTransaction,
  ): Promise<EsploraTransaction> {
    const status = await this.#getTransactionStatus(transaction);
    const vout = transaction.vout.map(transformOutput);
    const inputValue = await this.#getInputValue(transaction);
    const outputValue = vout.reduce((total, output) => total + output.value, 0);

    return {
      fee: Math.max(inputValue - outputValue, 0),
      locktime: transaction.locktime,
      size: transaction.size,
      status,
      txid: transaction.txid,
      version: transaction.version,
      vin: await Promise.all(
        transaction.vin.map((input) => this.#transformInput(input)),
      ),
      vout,
      weight: transaction.weight ?? transaction.vsize ?? transaction.size * 4,
    };
  }

  async #transformInput(input: BitcoinCoreInput): Promise<EsploraInput> {
    const isCoinbase = Boolean(input.coinbase);
    const prevout =
      input.txid && input.vout !== undefined
        ? await this.#getPrevout(input.txid, input.vout)
        : null;

    return {
      is_coinbase: isCoinbase,
      prevout,
      scriptsig: input.scriptSig?.hex ?? input.coinbase ?? '',
      scriptsig_asm: input.scriptSig?.asm ?? '',
      sequence: input.sequence,
      txid: input.txid ?? '0'.repeat(64),
      vout: input.vout ?? 4294967295,
      witness: input.txinwitness ?? [],
    };
  }

  async #getInputValue(
    transaction: BitcoinCoreRawTransaction,
  ): Promise<number> {
    let total = 0;
    for (const input of transaction.vin) {
      if (!input.txid || input.vout === undefined) {
        continue;
      }
      const prevout = await this.#getPrevout(input.txid, input.vout);
      total += prevout?.value ?? 0;
    }
    return total;
  }

  async #getPrevout(
    txid: string,
    outputIndex: number,
  ): Promise<EsploraOutput | null> {
    try {
      const transaction = await this.#rpc<BitcoinCoreRawTransaction>(
        'getrawtransaction',
        [txid, true],
      );
      return transformOutput(transaction.vout[outputIndex]);
    } catch {
      return null;
    }
  }

  async #getTransactionStatus(transaction: BitcoinCoreRawTransaction) {
    if (!transaction.blockhash) {
      return { confirmed: false };
    }

    // The Bitcoin snap runs on mainnet in E2E, so expose mainnet-shaped
    // chain metadata while sourcing transaction data from local regtest.
    return {
      block_hash: MAINNET_COMPAT_FUNDING_BLOCK_HASH,
      block_height: MAINNET_COMPAT_FUNDING_BLOCK_HEIGHT,
      block_time: transaction.blocktime ?? 1768824955,
      confirmed: true,
    };
  }

  #formatProcessOutput(): string {
    return formatProcessOutput(this.#stdout, this.#stderr);
  }
}

async function fetchJson<ResponseBody>(
  url: string,
  { timeoutMs = 10_000, ...options }: FetchJsonOptions = {},
): Promise<ResponseBody> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await response.text();
    const json = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      throw new Error(
        `Request to ${url} failed with ${response.status}: ${text}`,
      );
    }

    return json as ResponseBody;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveBitcoinRegtestPorts(
  ports: BitcoinRegtestLocalNodeOptions['ports'] = {},
): Promise<{ rpcPort: number }> {
  if (ports.rpcPort !== undefined) {
    assertValidPort(ports.rpcPort, 'Bitcoin RPC port');
  }

  if (
    ports.rpcPort !== undefined &&
    !(await isTcpPortAvailable(ports.rpcPort))
  ) {
    throw new Error(`Bitcoin RPC port ${ports.rpcPort} is already in use`);
  }

  const [allocatedRpcPort] =
    ports.rpcPort === undefined ? await getAvailablePorts(1) : [];
  const rpcPort = ports.rpcPort ?? allocatedRpcPort;

  if (rpcPort === undefined) {
    throw new Error('Unable to allocate Bitcoin regtest RPC port');
  }

  return { rpcPort };
}

function transformBlock(block: BitcoinCoreBlock): EsploraBlock {
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
    tx_count: block.nTx,
    version: block.version,
    weight: block.weight,
  };
}

function transformOutput(output: BitcoinCoreOutput): EsploraOutput {
  const scriptpubkey = output.scriptPubKey.hex;
  return {
    scriptpubkey,
    scriptpubkey_address:
      scriptpubkey === E2E_BTC_SCRIPTPUBKEY
        ? DEFAULT_BTC_ADDRESS
        : output.scriptPubKey.address,
    scriptpubkey_asm: output.scriptPubKey.asm,
    scriptpubkey_type: mapScriptPubKeyType(output.scriptPubKey.type),
    value: btcToSats(output.value),
  };
}

function mapScriptPubKeyType(type: string): string {
  if (type === 'witness_v0_keyhash') {
    return 'v0_p2wpkh';
  }
  if (type === 'witness_v0_scripthash') {
    return 'v0_p2wsh';
  }
  return type;
}

function getRegtestAddressForFunding(address: string): string {
  if (address === DEFAULT_BTC_ADDRESS) {
    return E2E_BTC_REGTEST_ADDRESS;
  }
  if (address.startsWith('bcrt1')) {
    return address;
  }
  throw new Error(`Unsupported Bitcoin fixture address: ${address}`);
}

function getScripthashForAddress(address: string): string {
  if (address === DEFAULT_BTC_ADDRESS || address === E2E_BTC_REGTEST_ADDRESS) {
    return E2E_BTC_SCRIPTHASH;
  }
  throw new Error(`Unsupported Bitcoin fixture address: ${address}`);
}

function btcToSats(value: number): number {
  return Math.round(value * SATS_IN_1_BTC);
}

function getPackageBinaryPath(command: string): string {
  return resolve(process.cwd(), 'node_modules', '.bin', command);
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode) {
    return;
  }

  await new Promise<void>((resolvePromise) => {
    const timeout = setTimeout(() => {
      try {
        if (process.platform !== 'win32' && child.pid) {
          process.kill(-child.pid, 'SIGKILL');
        } else {
          child.kill('SIGKILL');
        }
      } catch {
        // The process may already be gone.
      }
      resolvePromise();
    }, 5_000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolvePromise();
    });

    try {
      if (process.platform !== 'win32' && child.pid) {
        process.kill(-child.pid, 'SIGTERM');
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      clearTimeout(timeout);
      resolvePromise();
    }
  });
}

function appendProcessOutput(current: string, chunk: Buffer): string {
  const output = current + chunk.toString('utf8');
  return output.slice(-BITCOIN_NODE_PROCESS_OUTPUT_LIMIT);
}

function formatProcessOutput(stdout: string, stderr: string): string {
  return `\nstdout:\n${stdout || '<empty>'}\nstderr:\n${stderr || '<empty>'}`;
}

async function removeRuntimeDirectory(runtimeDirectory: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(runtimeDirectory, { force: true, recursive: true });
      return;
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }
      await delay(250);
    }
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
