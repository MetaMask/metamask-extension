import { spawn, type ChildProcess } from 'child_process';
import { mkdir, mkdtemp, readFile, rm, stat } from 'fs/promises';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import type { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  assertValidPort,
  getAvailablePorts,
  isTcpPortAvailable,
  isTcpPortRangeAvailable,
  parsePortRange,
  type PortRange,
} from '../ports';
import type {
  SolanaSeedAsset,
  SolanaTokenAccount,
  SolanaTokenMint,
} from './assets';

const SOLANA_NODE_PROCESS_OUTPUT_LIMIT = 8_000;
const SOLANA_RPC_PUBSUB_PORT_OFFSET = 1;
const SOLANA_VALIDATOR_PORT_COUNT = 32;
const SOLANA_VALIDATOR_PORT_ALLOCATION_ATTEMPTS = 20;
const SOLANA_VALIDATOR_MAX_PORT = 65_535;

export const LAMPORTS_PER_SOL = 1_000_000_000;

const requireFromCurrentFile = createRequire(__filename);
const requireFromSolanaTestDapp = createRequire(
  requireFromCurrentFile.resolve('@metamask/test-dapp-solana/package.json'),
);

export type SolanaLocalNodeOptions = {
  initialBalances?: Record<string, number>;
  loadState?: string;
  ports?: {
    dynamicPortRange?: string;
    faucetPort?: number;
    gossipPort?: number;
    rpcPort?: number;
  };
};

export type SolanaValidatorPorts = {
  dynamicPortRange: string;
  faucetPort: number;
  gossipPort: number;
  rpcPort: number;
};

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

type JsonRpcResponse<ResponseBody> = {
  error?: { code: number; message: string };
  result?: ResponseBody;
};

type SolanaValidatorAccountState = {
  address: string;
  path: string;
};

type SolanaValidatorProgramState = {
  address: string;
  path: string;
};

type SolanaValidatorUpgradeableProgramState = SolanaValidatorProgramState & {
  upgradeAuthority: string;
};

type SolanaValidatorStateManifest = {
  accountDirs?: string[];
  accountDirectories?: string[];
  accounts?: Record<string, string> | SolanaValidatorAccountState[];
  bpfPrograms?: SolanaValidatorProgramState[];
  upgradeablePrograms?: SolanaValidatorUpgradeableProgramState[];
};

type SolanaSplTokenModule = {
  createMint: (
    connection: Connection,
    payer: Keypair,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    decimals: number,
    keypair: Keypair | undefined,
    confirmOptions: SolanaConfirmOptions,
    programId: PublicKey,
  ) => Promise<PublicKey>;
  getOrCreateAssociatedTokenAccount: (
    connection: Connection,
    payer: Keypair,
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve: boolean,
    commitment: 'confirmed',
    confirmOptions: SolanaConfirmOptions,
    programId: PublicKey,
  ) => Promise<{ address: PublicKey }>;
  mintTo: (
    connection: Connection,
    payer: Keypair,
    mint: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: bigint,
    multiSigners: Keypair[],
    confirmOptions: SolanaConfirmOptions,
    programId: PublicKey,
  ) => Promise<string>;
  token2022ProgramId: PublicKey;
  tokenProgramId: PublicKey;
};

type SolanaConfirmOptions = {
  commitment: 'confirmed';
};

export class SolanaNode {
  #connection: Connection | undefined;

  #nodeProcess: ChildProcess | undefined;

  #nodeProcessExitError: Error | undefined;

  #rpcPort: number | undefined;

  #runtimeDirectory: string | undefined;

  #seederPayer: Keypair | undefined;

  #stderr = '';

  #stdout = '';

  readonly tokenMints: Partial<Record<string, SolanaTokenMint>> = {};

  get baseUrl(): string {
    if (!this.#rpcPort) {
      throw new Error('Solana local node has not started');
    }
    return `http://127.0.0.1:${this.#rpcPort}`;
  }

  async start(options: SolanaLocalNodeOptions = {}): Promise<void> {
    try {
      await this.#startNativeSolanaValidator(options);
      await this.waitForReady(120_000);

      for (const [address, lamports] of Object.entries(
        options.initialBalances ?? {},
      )) {
        if (lamports > 0) {
          await this.requestAirdrop(address, lamports);
          await this.waitForBalance(address, lamports, 60_000);
        }
      }
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async #startNativeSolanaValidator(
    options: Pick<SolanaLocalNodeOptions, 'loadState' | 'ports'> = {},
  ): Promise<void> {
    await this.#runPackageBinary('solana-test-validator-up', ['install']);

    const ports = options.ports ?? {};
    const runtimeDirectory = await mkdtemp(join(tmpdir(), 'solana-e2e-'));
    const ledgerDirectory = join(runtimeDirectory, 'ledger');
    const { dynamicPortRange, faucetPort, gossipPort, rpcPort } =
      await resolveSolanaValidatorPorts(ports);
    const stateArgs = options.loadState
      ? await buildSolanaValidatorStateArgs(options.loadState)
      : [];
    await mkdir(ledgerDirectory, { recursive: true });

    this.#rpcPort = rpcPort;
    this.#runtimeDirectory = runtimeDirectory;
    this.#nodeProcessExitError = undefined;
    this.#stderr = '';
    this.#stdout = '';

    const validatorBinary = getPackageBinaryPath('solana-test-validator');
    // With a derived RPC port, solana-test-validator uses a 32-port bundle:
    // RPC, implicit RPC pubsub at `rpcPort + 1`, faucet, gossip, and the
    // dynamic range. This validator version also opens UDP *:8000 outside the
    // configurable range. Keep the whole bundle non-overlapping for parallel
    // runs and revisit if the validator exposes a flag for that UDP listener.
    const nodeProcess = spawn(
      validatorBinary,
      [
        '--reset',
        '--quiet',
        '--ledger',
        ledgerDirectory,
        '--rpc-port',
        String(rpcPort),
        '--faucet-port',
        String(faucetPort),
        '--gossip-port',
        String(gossipPort),
        '--dynamic-port-range',
        dynamicPortRange,
        '--bind-address',
        '127.0.0.1',
        ...stateArgs,
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
        `solana-test-validator exited with code ${code ?? 'null'} and signal ${
          signal ?? 'null'
        }.${this.#formatProcessOutput()}`,
      );
    });
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

  async quit(): Promise<void> {
    const nodeProcess = this.#nodeProcess;
    const runtimeDirectory = this.#runtimeDirectory;
    this.#nodeProcess = undefined;
    this.#runtimeDirectory = undefined;
    this.#rpcPort = undefined;
    this.#connection = undefined;
    this.#seederPayer = undefined;

    if (nodeProcess) {
      await stopProcess(nodeProcess);
    }

    if (runtimeDirectory) {
      await rm(runtimeDirectory, { force: true, recursive: true });
    }
  }

  async waitForReady(timeoutMs = 60_000): Promise<void> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (this.#nodeProcessExitError) {
        throw this.#nodeProcessExitError;
      }

      try {
        const health = await this.request<string>('getHealth', [], {
          timeoutMs: 1_000,
        });
        if (health === 'ok') {
          return;
        }
      } catch {
        // The RPC port opens before the validator is fully ready.
      }

      await delay(500);
    }

    throw new Error(
      `Timed out waiting for solana-test-validator to start.${this.#formatProcessOutput()}`,
    );
  }

  async request<ResponseBody>(
    method: string,
    params: unknown[] = [],
    options: FetchJsonOptions = {},
  ): Promise<ResponseBody> {
    const response = await fetchJson<JsonRpcResponse<ResponseBody>>(
      this.baseUrl,
      {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify({
          id: 'e2e',
          jsonrpc: '2.0',
          method,
          params,
        }),
      },
    );

    if (response.error) {
      throw new Error(`Solana RPC ${method} failed: ${response.error.message}`);
    }

    return response.result as ResponseBody;
  }

  async createTokenMint(asset: SolanaSeedAsset): Promise<SolanaTokenMint> {
    if (asset.mintAddress) {
      throw new Error(
        `Cannot create exact Solana mint ${asset.mintAddress}. Use loadState with account snapshots for exact mint addresses.`,
      );
    }

    const payer = await this.#getSeederPayer();
    const connection = await this.#getConnection();
    const { createMint: createSolanaMint } = loadSolanaSplToken();
    const tokenProgramId = getTokenProgramPublicKey(asset.type);
    const decimals = asset.type === 'nft' ? 0 : asset.decimals;
    const mintAddress = await createSolanaMint(
      connection,
      payer,
      payer.publicKey,
      null,
      decimals,
      undefined,
      { commitment: 'confirmed' },
      tokenProgramId,
    );
    const mint = {
      address: mintAddress.toBase58(),
      decimals,
      name: asset.name,
      symbol: asset.symbol,
      tokenProgramId: tokenProgramId.toBase58(),
      type: asset.type,
      ...(asset.type === 'nft' && asset.uri ? { uri: asset.uri } : {}),
    } satisfies SolanaTokenMint;
    this.tokenMints[asset.symbol] = mint;

    return mint;
  }

  async mintTokenToAddress(
    mint: SolanaTokenMint,
    ownerAddress: string,
    amount: string,
  ): Promise<SolanaTokenAccount> {
    const payer = await this.#getSeederPayer();
    const connection = await this.#getConnection();
    const { PublicKey: SolanaPublicKey } = loadSolanaWeb3();
    const {
      getOrCreateAssociatedTokenAccount:
        getOrCreateSolanaAssociatedTokenAccount,
      mintTo: mintSolanaTokenTo,
    } = loadSolanaSplToken();
    const tokenProgramId = new SolanaPublicKey(mint.tokenProgramId);
    const mintPublicKey = new SolanaPublicKey(mint.address);
    const ownerPublicKey = new SolanaPublicKey(ownerAddress);
    const tokenAccount = await getOrCreateSolanaAssociatedTokenAccount(
      connection,
      payer,
      mintPublicKey,
      ownerPublicKey,
      false,
      'confirmed',
      { commitment: 'confirmed' },
      tokenProgramId,
    );

    await mintSolanaTokenTo(
      connection,
      payer,
      mintPublicKey,
      tokenAccount.address,
      payer,
      BigInt(amount),
      [],
      { commitment: 'confirmed' },
      tokenProgramId,
    );

    return {
      address: tokenAccount.address.toBase58(),
      mintAddress: mint.address,
      ownerAddress,
      symbol: mint.symbol,
    };
  }

  async requestAirdrop(address: string, lamports: number): Promise<string> {
    return await this.request<string>('requestAirdrop', [address, lamports]);
  }

  async getBalance(address: string): Promise<number> {
    const response = await this.request<{
      context: unknown;
      value: number;
    }>('getBalance', [address, { commitment: 'confirmed' }]);
    return response.value;
  }

  async waitForBalance(
    address: string,
    expectedMinimumLamports: number,
    timeoutMs = 30_000,
  ): Promise<void> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (this.#nodeProcessExitError) {
        throw this.#nodeProcessExitError;
      }

      if ((await this.getBalance(address)) >= expectedMinimumLamports) {
        return;
      }

      await delay(500);
    }

    throw new Error(
      `Timed out waiting for Solana account ${address} to reach ${expectedMinimumLamports} lamports.`,
    );
  }

  #formatProcessOutput(): string {
    return formatProcessOutput(this.#stdout, this.#stderr);
  }

  async #getConnection(): Promise<Connection> {
    const { Connection: SolanaConnection } = loadSolanaWeb3();
    this.#connection ??= new SolanaConnection(this.baseUrl, 'confirmed');
    return this.#connection;
  }

  async #getSeederPayer(): Promise<Keypair> {
    if (this.#seederPayer) {
      return this.#seederPayer;
    }

    const { Keypair: SolanaKeypair } = loadSolanaWeb3();
    const payer = SolanaKeypair.generate();
    await this.requestAirdrop(
      payer.publicKey.toBase58(),
      10 * LAMPORTS_PER_SOL,
    );
    await this.waitForBalance(payer.publicKey.toBase58(), LAMPORTS_PER_SOL);
    this.#seederPayer = payer;

    return payer;
  }
}

export async function buildSolanaValidatorStateArgs(
  loadState: string,
): Promise<string[]> {
  const absoluteLoadState = resolve(process.cwd(), loadState);
  const loadStateStats = await stat(absoluteLoadState);
  const manifestPath = loadStateStats.isDirectory()
    ? join(absoluteLoadState, 'manifest.json')
    : absoluteLoadState;
  const manifestDirectory = loadStateStats.isDirectory()
    ? absoluteLoadState
    : dirname(absoluteLoadState);

  let manifest: SolanaValidatorStateManifest;
  try {
    manifest = JSON.parse(
      await readFile(manifestPath, 'utf8'),
    ) as SolanaValidatorStateManifest;
  } catch (error) {
    if (
      loadStateStats.isDirectory() &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return ['--account-dir', absoluteLoadState];
    }
    throw error;
  }

  return [
    ...getAccountStateArgs(manifest.accounts, manifestDirectory),
    ...getAccountDirectoryStateArgs(
      [...(manifest.accountDirs ?? []), ...(manifest.accountDirectories ?? [])],
      manifestDirectory,
    ),
    ...getProgramStateArgs(manifest.bpfPrograms ?? [], manifestDirectory),
    ...getUpgradeableProgramStateArgs(
      manifest.upgradeablePrograms ?? [],
      manifestDirectory,
    ),
  ];
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

function getPackageBinaryPath(command: string): string {
  return resolve(process.cwd(), 'node_modules', '.bin', command);
}

function getTokenProgramPublicKey(
  assetType: SolanaSeedAsset['type'],
): PublicKey {
  const { token2022ProgramId, tokenProgramId } = loadSolanaSplToken();
  if (assetType === 'spl-token-2022') {
    return token2022ProgramId;
  }

  return tokenProgramId;
}

function loadSolanaWeb3(): typeof import('@solana/web3.js') {
  return requireFromSolanaTestDapp(
    '@solana/web3.js',
  ) as typeof import('@solana/web3.js');
}

function loadSolanaSplToken(): SolanaSplTokenModule {
  const splTokenModule = requireFromSolanaTestDapp(
    '@solana/spl-token',
  ) as Record<string, unknown>;

  return {
    createMint: splTokenModule.createMint as SolanaSplTokenModule['createMint'],
    getOrCreateAssociatedTokenAccount:
      splTokenModule.getOrCreateAssociatedTokenAccount as SolanaSplTokenModule['getOrCreateAssociatedTokenAccount'],
    mintTo: splTokenModule.mintTo as SolanaSplTokenModule['mintTo'],
    token2022ProgramId: splTokenModule.TOKEN_2022_PROGRAM_ID as PublicKey,
    tokenProgramId: splTokenModule.TOKEN_PROGRAM_ID as PublicKey,
  };
}

function getAccountStateArgs(
  accounts: SolanaValidatorStateManifest['accounts'],
  manifestDirectory: string,
): string[] {
  if (!accounts) {
    return [];
  }

  const accountEntries = Array.isArray(accounts)
    ? accounts
    : Object.entries(accounts).map(([address, path]) => ({ address, path }));

  return accountEntries.flatMap(({ address, path }) => [
    '--account',
    address,
    resolve(manifestDirectory, path),
  ]);
}

function getAccountDirectoryStateArgs(
  accountDirectories: string[],
  manifestDirectory: string,
): string[] {
  return accountDirectories.flatMap((accountDirectory) => [
    '--account-dir',
    resolve(manifestDirectory, accountDirectory),
  ]);
}

function getProgramStateArgs(
  programs: SolanaValidatorProgramState[],
  manifestDirectory: string,
): string[] {
  return programs.flatMap(({ address, path }) => [
    '--bpf-program',
    address,
    resolve(manifestDirectory, path),
  ]);
}

function getUpgradeableProgramStateArgs(
  programs: SolanaValidatorUpgradeableProgramState[],
  manifestDirectory: string,
): string[] {
  return programs.flatMap(({ address, path, upgradeAuthority }) => [
    '--upgradeable-program',
    address,
    resolve(manifestDirectory, path),
    upgradeAuthority,
  ]);
}

export async function resolveSolanaValidatorPorts(
  ports: SolanaLocalNodeOptions['ports'] = {},
): Promise<SolanaValidatorPorts> {
  validateSolanaIndividualPorts(ports);
  const { dynamicPortRange } = ports;

  if (Object.values(ports).every((port) => port === undefined)) {
    return await findSolanaValidatorPortBundle();
  }

  if (ports.rpcPort !== undefined && !dynamicPortRange) {
    const derivedPorts = deriveSolanaValidatorPortsFromRpcPort(ports.rpcPort);
    return await validateSolanaValidatorPorts({
      ...derivedPorts,
      faucetPort: ports.faucetPort ?? derivedPorts.faucetPort,
      gossipPort: ports.gossipPort ?? derivedPorts.gossipPort,
    });
  }

  if (!dynamicPortRange) {
    const derivedPorts = await findSolanaValidatorPortBundle(
      getDefinedPorts([ports.faucetPort, ports.gossipPort]),
    );
    return await validateSolanaValidatorPorts({
      ...derivedPorts,
      faucetPort: ports.faucetPort ?? derivedPorts.faucetPort,
      gossipPort: ports.gossipPort ?? derivedPorts.gossipPort,
    });
  }

  return await resolveSolanaValidatorPortsWithDynamicRange({
    ...ports,
    dynamicPortRange,
  });
}

async function findSolanaValidatorPortBundle(
  excludedPorts: Iterable<number> = [],
): Promise<SolanaValidatorPorts> {
  const excluded = new Set(excludedPorts);

  for (
    let attempt = 0;
    attempt < SOLANA_VALIDATOR_PORT_ALLOCATION_ATTEMPTS;
    attempt += 1
  ) {
    const [rpcPort] = await getAvailablePorts(1, excluded);

    try {
      const ports = deriveSolanaValidatorPortsFromRpcPort(rpcPort);
      const reservedPorts = getSolanaValidatorReservedPorts(ports);

      if (reservedPorts.some((port) => excluded.has(port))) {
        excluded.add(rpcPort);
        continue;
      }

      if (await isTcpPortRangeAvailable(rpcPort, SOLANA_VALIDATOR_PORT_COUNT)) {
        return ports;
      }

      for (const port of reservedPorts) {
        excluded.add(port);
      }
    } catch {
      excluded.add(rpcPort);
      continue;
    }
  }

  throw new Error(
    'Unable to allocate an available Solana validator port range',
  );
}

function deriveSolanaValidatorPortsFromRpcPort(
  rpcPort: number,
): SolanaValidatorPorts {
  assertValidPort(rpcPort, 'Solana RPC port');

  const lastPort = rpcPort + SOLANA_VALIDATOR_PORT_COUNT - 1;
  if (lastPort > SOLANA_VALIDATOR_MAX_PORT) {
    throw new Error('Solana validator port range exceeds 65535');
  }

  return {
    dynamicPortRange: `${rpcPort + 4}-${lastPort}`,
    faucetPort: rpcPort + 2,
    gossipPort: rpcPort + 3,
    rpcPort,
  };
}

async function resolveSolanaValidatorPortsWithDynamicRange(
  ports: SolanaLocalNodeOptions['ports'] & { dynamicPortRange: string },
): Promise<SolanaValidatorPorts> {
  const dynamicRange = parsePortRange(ports.dynamicPortRange);
  const explicitPorts = getDefinedPorts([
    ports.faucetPort,
    ports.gossipPort,
    ports.rpcPort,
    ...getPortRangeValues(dynamicRange),
  ]);
  const missingPortKeys = (
    ['rpcPort', 'faucetPort', 'gossipPort'] as const
  ).filter((key) => ports[key] === undefined);
  const excludedPorts = new Set(explicitPorts);
  let lastError: Error | undefined;

  for (
    let attempt = 0;
    attempt < SOLANA_VALIDATOR_PORT_ALLOCATION_ATTEMPTS;
    attempt += 1
  ) {
    const allocatedPorts = await getAvailablePorts(
      missingPortKeys.length,
      excludedPorts,
    );
    const resolvedPorts = {
      dynamicPortRange: ports.dynamicPortRange,
      faucetPort: ports.faucetPort,
      gossipPort: ports.gossipPort,
      rpcPort: ports.rpcPort,
    };

    for (const key of missingPortKeys) {
      resolvedPorts[key] = allocatedPorts.shift();
    }

    try {
      return await validateSolanaValidatorPorts(
        resolvedPorts as SolanaValidatorPorts,
      );
    } catch (error) {
      lastError = error as Error;
      for (const port of getDefinedPorts([
        resolvedPorts.faucetPort,
        resolvedPorts.gossipPort,
        resolvedPorts.rpcPort,
      ])) {
        excludedPorts.add(port);
      }
    }
  }

  throw new Error(
    `Unable to allocate available Solana validator ports.${
      lastError ? ` ${lastError.message}` : ''
    }`,
  );
}

async function validateSolanaValidatorPorts(
  ports: SolanaValidatorPorts,
): Promise<SolanaValidatorPorts> {
  const dynamicRange = assertSolanaValidatorPortStructure(ports);

  for (const [label, port] of [
    ['Solana RPC port', ports.rpcPort],
    ['Solana RPC pubsub port', ports.rpcPort + SOLANA_RPC_PUBSUB_PORT_OFFSET],
    ['Solana faucet port', ports.faucetPort],
    ['Solana gossip port', ports.gossipPort],
  ] as const) {
    if (!(await isTcpPortAvailable(port))) {
      throw new Error(`${label} ${port} is already in use`);
    }
  }

  const dynamicRangeCount = dynamicRange.endPort - dynamicRange.startPort + 1;
  if (
    !(await isTcpPortRangeAvailable(dynamicRange.startPort, dynamicRangeCount))
  ) {
    throw new Error(
      `Solana dynamic port range ${ports.dynamicPortRange} is already in use`,
    );
  }

  return ports;
}

function assertSolanaValidatorPortStructure(
  ports: SolanaValidatorPorts,
): PortRange {
  validateSolanaIndividualPorts(ports);

  const dynamicRange = parsePortRange(ports.dynamicPortRange);
  const rpcPubsubPort = ports.rpcPort + SOLANA_RPC_PUBSUB_PORT_OFFSET;
  assertValidPort(rpcPubsubPort, 'Solana RPC pubsub port');

  const namedPorts = [
    ['Solana RPC port', ports.rpcPort],
    ['Solana RPC pubsub port', rpcPubsubPort],
    ['Solana faucet port', ports.faucetPort],
    ['Solana gossip port', ports.gossipPort],
  ] as const;
  const seenPorts = new Map<number, string>();

  for (const [label, port] of namedPorts) {
    const duplicateLabel = seenPorts.get(port);
    if (duplicateLabel) {
      throw new Error(`${label} must be different from ${duplicateLabel}`);
    }
    seenPorts.set(port, label);

    if (isPortInRange(port, dynamicRange)) {
      throw new Error(`${label} must be outside the Solana dynamic port range`);
    }
  }

  return dynamicRange;
}

function validateSolanaIndividualPorts(
  ports: Partial<SolanaValidatorPorts>,
): void {
  for (const [label, port] of [
    ['Solana RPC port', ports.rpcPort],
    ['Solana faucet port', ports.faucetPort],
    ['Solana gossip port', ports.gossipPort],
  ] as const) {
    if (port !== undefined) {
      assertValidPort(port, label);
    }
  }

  if (ports.dynamicPortRange) {
    parsePortRange(ports.dynamicPortRange);
  }
}

function getSolanaValidatorReservedPorts(
  ports: SolanaValidatorPorts,
): number[] {
  const dynamicRange = parsePortRange(ports.dynamicPortRange);
  return [
    ports.rpcPort,
    ports.rpcPort + SOLANA_RPC_PUBSUB_PORT_OFFSET,
    ports.faucetPort,
    ports.gossipPort,
    ...getPortRangeValues(dynamicRange),
  ];
}

function getPortRangeValues(range: PortRange): number[] {
  return Array.from(
    { length: range.endPort - range.startPort + 1 },
    (_, offset) => range.startPort + offset,
  );
}

function isPortInRange(port: number, range: PortRange): boolean {
  return port >= range.startPort && port <= range.endPort;
}

function getDefinedPorts(ports: Iterable<number | undefined>): number[] {
  return [...ports].filter((port): port is number => port !== undefined);
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
  return output.slice(-SOLANA_NODE_PROCESS_OUTPUT_LIMIT);
}

function formatProcessOutput(stdout: string, stderr: string): string {
  return `\nstdout:\n${stdout || '<empty>'}\nstderr:\n${stderr || '<empty>'}`;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
