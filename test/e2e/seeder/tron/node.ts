/* eslint-disable @typescript-eslint/naming-convention */
/**
 * @file node.ts — Tron local node seeder
 *
 * The local node runs a native java-tron private network. The
 * `@metamask-previews/java-tron-up` package installs the managed Java runtime,
 * FullNode.jar, and the node_modules/.bin/java-tron wrapper used here.
 */
import { spawn, type ChildProcess } from 'child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { createRequire } from 'module';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { sha256 } from 'ethereum-cryptography/sha256';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';
import {
  assertValidPort,
  getAvailablePorts,
  isTcpPortAvailable,
} from '../ports';
import {
  TRON_TEST_ASSETS,
  TronLocalNodeOptions,
  TronNativeAccount,
  TronTrc10Symbol,
  TronTrc10Token,
  TronTrc20Symbol,
  TronTrc20Token,
  base58AddressToHex,
  createTronGridAccountResponse,
  encodeTrc20TransferParameter,
  getContractAddressFromTx,
  hexAddressToBase58,
  normalizeTronHexAddress,
} from './assets';
import {
  createJavaTronPrivateNetworkConfig,
  type JavaTronPrivateNetworkPorts,
} from './java-tron-config';
import {
  encodeTrc20ConstructorParameters,
  getTronSmartContractConfig,
} from './smart-contracts';
import { resolveTronLocalNodeOptions } from './state';

type Base58Encoder = {
  encode(input: Uint8Array): string;
};

const requireFromCurrentFile = createRequire(__filename);
const bs58 = requireFromCurrentFile('bs58').default as Base58Encoder;

const JAVA_TRON_GENESIS_PRIVATE_KEY =
  '0000000000000000000000000000000000000000000000000000000000000001';
const JAVA_TRON_GENESIS_ADDRESS = 'TMVQGm1qAQYVdetCeGRRkTWYYrLXuHK2HC';
const JAVA_TRON_PROCESS_OUTPUT_LIMIT = 8_000;
const JAVA_TRON_PRIVATE_NETWORK_PORT_KEYS = [
  'fullNodePort',
] as const satisfies readonly (keyof JavaTronPrivateNetworkPorts)[];

const JAVA_TRON_PRIVATE_NETWORK_PORT_LABELS = {
  fullNodePort: 'java-tron HTTP full node port',
} as const satisfies Record<keyof JavaTronPrivateNetworkPorts, string>;

/**
 * Private keys for known E2E test accounts, keyed by Tron base58 address.
 * These are derived from E2E_SRP (`spread raise short crane omit tent fringe
 * mandate neglect detail suspect cradle`) via the Tron BIP44 path
 * `m/44'/195'/0'/0/<index>`. Storing them here follows the same pattern as
 * Ganache/Anvil seeders, which hard-code the pre-funded account keys.
 *
 * When `freezeBalanceV2` is called for one of these addresses, it signs the
 * freeze transaction with the owner's own key (required by Stake 2.0 —
 * `owner_address` must match the transaction signer). If the address is not
 * present in this map, `freezeBalanceV2` throws; add the derived key here
 * before calling `freezeBalanceV2` with a new test address.
 */
const E2E_TEST_ACCOUNT_PRIVATE_KEYS: Readonly<Record<string, string>> = {
  // DEFAULT_TRON_ADDRESS — m/44'/195'/0'/0/0 from E2E_SRP
  TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3:
    '290f1eb76a3715ff19b888131d1b152ea755e7c5e1315d52a030107058bd631f',
};

type TronFundingAccount = {
  address: string;
  privateKey: string;
};

type TronAccountResponse = {
  address?: string;
  balance?: number;
};

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

export class TronNode {
  #fundingAccount: TronFundingAccount | undefined;

  #fullNodePort: number | undefined;

  #nodeProcess: ChildProcess | undefined;

  #nodeProcessExitError: Error | undefined;

  #runtimeDirectory: string | undefined;

  #stderr = '';

  #stdout = '';

  readonly #trc10Balances: Record<
    string,
    Partial<Record<TronTrc10Symbol, string>>
  > = {};

  readonly #trc20Balances: Record<
    string,
    Partial<Record<TronTrc20Symbol, string>>
  > = {};

  readonly #stakedTrxBalances: Record<string, string> = {};

  get baseUrl(): string {
    if (!this.#fullNodePort) {
      throw new Error('Tron local node has not started');
    }
    return `http://127.0.0.1:${this.#fullNodePort}`;
  }

  readonly trc10Tokens: Partial<Record<TronTrc10Symbol, TronTrc10Token>> = {};

  readonly trc20Tokens: Partial<Record<TronTrc20Symbol, TronTrc20Token>> = {};

  /**
   * Starts a native java-tron private network, waits for the funded genesis
   * account to become available, and seeds any requested balances into the
   * MetaMask-controlled Tron account. This keeps the same async start() contract
   * that Ganache and Anvil expose to withFixtures.
   *
   * @param options - Start options.
   * @param options.initialBalances - Map of Tron address to amount in SUN.
   * @param options.ports - java-tron private network ports.
   * @param options.trc10Balances - Map of Tron address to named TRC10 balances.
   * @param options.trc20Balances - Map of Tron address to named TRC20 balances.
   * @param options.stakedTrxBalances - Map of Tron address to staked TRX in SUN.
   * @param options.trc721Balances - Accepted and ignored placeholder for TRC721.
   * @param options.trc1155Balances - Accepted and ignored placeholder for TRC1155.
   */
  async start(options: TronLocalNodeOptions = {}): Promise<void> {
    this.#fundingAccount = undefined;
    const resolvedOptions = await resolveTronLocalNodeOptions(options);

    try {
      await this.#startNativeJavaTron(resolvedOptions.ports);
      await this.waitForReady(120_000);

      for (const [address, amountInSun] of Object.entries(
        resolvedOptions.initialBalances ?? {},
      )) {
        if (amountInSun > 0) {
          await this.fundAccount(address, amountInSun);
        }
      }

      await this.initializeTrc10Balances(resolvedOptions.trc10Balances ?? {});
      await this.initializeTrc20Balances(resolvedOptions.trc20Balances ?? {});

      await this.initializeStakedTrxBalances(
        resolvedOptions.stakedTrxBalances ?? {},
      );
      // `trc721Balances` and `trc1155Balances` are accepted and ignored — see the
      // JSDoc on TronLocalNodeOptions.
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async #startNativeJavaTron(
    ports: TronLocalNodeOptions['ports'] = {},
  ): Promise<void> {
    await this.#runPackageBinary('java-tron-up', ['install']);

    const runtimeDirectory = await mkdtemp(join(tmpdir(), 'java-tron-e2e-'));
    const configPath = join(runtimeDirectory, 'fullnode.conf');
    const outputDirectory = join(runtimeDirectory, 'output');
    const resolvedPorts = await resolveJavaTronPrivateNetworkPorts(ports);
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(
      configPath,
      createJavaTronPrivateNetworkConfig(resolvedPorts),
    );

    this.#fullNodePort = resolvedPorts.fullNodePort;
    this.#runtimeDirectory = runtimeDirectory;
    this.#nodeProcessExitError = undefined;
    this.#stderr = '';
    this.#stdout = '';

    const javaTronBinary = getPackageBinaryPath('java-tron');
    // java-tron brings up one listener for E2E: full-node HTTP (`baseUrl`).
    // Solidity HTTP/gRPC, PBFT HTTP/gRPC, JSON-RPC, P2P, and backup are
    // disabled in the generated config; make any re-enabled listener
    // customizable before parallelizing it.
    const nodeProcess = spawn(
      javaTronBinary,
      ['-c', configPath, '--witness', '-d', outputDirectory],
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
        `java-tron exited with code ${code ?? 'null'} and signal ${
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
    this.#fullNodePort = undefined;
    this.#nodeProcess = undefined;
    this.#runtimeDirectory = undefined;

    if (nodeProcess) {
      await stopProcess(nodeProcess);
    }

    if (runtimeDirectory) {
      await rm(runtimeDirectory, { force: true, recursive: true });
    }
  }

  async waitForReady(timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      this.#throwIfNodeExited();
      try {
        const data = (await this.fetchJson('/wallet/getnowblock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
          timeoutMs: 5_000,
        })) as {
          block_header?: {
            raw_data?: {
              number?: number | string;
              timestamp?: number | string;
            };
          };
        };
        const blockNumber = Number(data.block_header?.raw_data?.number ?? 0);
        const blockTimestamp = Number(
          data.block_header?.raw_data?.timestamp ?? 0,
        );

        if (
          blockNumber > 0 &&
          blockTimestamp > Date.now() - 60_000 &&
          (await this.hasFundedGenesisAccount())
        ) {
          return;
        }
      } catch {
        // Not ready yet
      }
      await new Promise((r) => setTimeout(r, 1_000));
    }
    throw new Error(
      `Tron local node did not become ready within ${timeoutMs}ms`,
    );
  }

  async hasFundedGenesisAccount(): Promise<boolean> {
    const fundingAccount = await this.getFundingAccount();
    const account = (await this.fetchJson('/wallet/getaccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: fundingAccount.address,
        visible: true,
      }),
      timeoutMs: 5_000,
    })) as TronAccountResponse;

    return Boolean(account.address && (account.balance ?? 0) > 0);
  }

  async fundAccount(toAddress: string, amountInSun: number): Promise<void> {
    const fundingAccount = await this.getFundingAccount();

    // 1. Build an unsigned TransferContract transaction
    const createResp = await fetch(`${this.baseUrl}/wallet/createtransaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fundingAccount.address,
        to_address: toAddress,
        amount: amountInSun,
        visible: true,
      }),
    });
    if (!createResp.ok) {
      throw new Error(
        `createtransaction HTTP ${createResp.status}: ${await createResp.text()}`,
      );
    }
    const tx = (await createResp.json()) as {
      raw_data_hex?: string;
      [key: string]: unknown;
    };

    if (!tx.raw_data_hex) {
      throw new Error(
        `createtransaction failed: ${JSON.stringify(tx)}\n` +
          `Check that the java-tron genesis address (${fundingAccount.address}) is funded and the node has produced at least one block.`,
      );
    }

    await this.signAndBroadcastTransaction(tx, fundingAccount.privateKey);
  }

  getTrc10Balances(address: string): Partial<Record<TronTrc10Symbol, string>> {
    return this.#trc10Balances[address] ?? {};
  }

  getTrc20Balances(address: string): Partial<Record<TronTrc20Symbol, string>> {
    return this.#trc20Balances[address] ?? {};
  }

  getStakedTrxBalance(address: string): string {
    return this.#stakedTrxBalances[address] ?? '0';
  }

  async getTronGridAccountResponse(address: string): Promise<unknown> {
    const nativeAccount = (await this.fetchJson('/wallet/getaccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, visible: true }),
    })) as TronNativeAccount;

    return createTronGridAccountResponse({
      address,
      nativeAccount,
      stakedTrxBalance: this.getStakedTrxBalance(address),
      trc10Balances: this.getTrc10Balances(address),
      trc10Tokens: this.trc10Tokens,
      trc20Balances: this.getTrc20Balances(address),
      trc20Tokens: this.trc20Tokens,
    });
  }

  async issueTrc10Token(
    symbol: TronTrc10Symbol,
    totalSupply: string,
  ): Promise<TronTrc10Token> {
    const metadata = TRON_TEST_ASSETS[symbol];
    const fundingAccount = await this.getFundingAccount();
    const now = Date.now();
    const tx = await this.fetchJson('/wallet/createassetissue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fundingAccount.address,
        name: metadata.name,
        abbr: metadata.symbol,
        description: metadata.name,
        url: 'https://metamask.io',
        total_supply: Number(totalSupply),
        trx_num: 1,
        num: 1,
        precision: metadata.decimals,
        start_time: now,
        end_time: now + 86_400_000,
        free_asset_net_limit: 0,
        public_free_asset_net_limit: 0,
        visible: true,
      }),
    });
    await this.signAndBroadcastTransaction(tx, fundingAccount.privateKey);

    const account = (await this.fetchJson('/wallet/getaccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: fundingAccount.address, visible: true }),
    })) as { asset_issued_ID?: string; asset_issued_name?: string };

    const token = {
      ...metadata,
      symbol,
      tokenId: account.asset_issued_ID ?? account.asset_issued_name ?? symbol,
    };
    this.trc10Tokens[symbol] = token;

    return token;
  }

  async transferTrc10Token(
    token: TronTrc10Token,
    toAddress: string,
    amount: string,
  ): Promise<void> {
    const fundingAccount = await this.getFundingAccount();
    const tx = await this.fetchJson('/wallet/transferasset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fundingAccount.address,
        to_address: toAddress,
        asset_name: token.tokenId,
        amount: Number(amount),
        visible: true,
      }),
    });
    await this.signAndBroadcastTransaction(tx, fundingAccount.privateKey);
  }

  async deployTrc20Token(
    symbol: TronTrc20Symbol,
    initialSupply = '0',
  ): Promise<TronTrc20Token> {
    const contractConfig = getTronSmartContractConfig(symbol);
    const fundingAccount = await this.getFundingAccount();
    const tx = (await this.fetchJson('/wallet/deploycontract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fundingAccount.address,
        name: contractConfig.symbol,
        abi: JSON.stringify(contractConfig.abi),
        bytecode: contractConfig.bytecode,
        parameter: encodeTrc20ConstructorParameters(
          contractConfig,
          initialSupply,
        ),
        call_value: 0,
        consume_user_resource_percent: 100,
        fee_limit: 150_000_000,
        origin_energy_limit: 10_000_000,
        visible: true,
      }),
    })) as {
      contract_address?: string;
      txID?: string;
      raw_data?: {
        contract?: {
          parameter?: {
            value?: {
              contract_address?: string;
              new_contract?: {
                contract_address?: string;
              };
            };
          };
        }[];
      };
    };
    await this.signAndBroadcastTransaction(tx, fundingAccount.privateKey);

    const txContractValue = tx.raw_data?.contract?.[0]?.parameter?.value;
    const contractAddress =
      tx.contract_address ??
      txContractValue?.new_contract?.contract_address ??
      txContractValue?.contract_address;
    const address = contractAddress
      ? hexAddressToBase58(normalizeTronHexAddress(contractAddress))
      : getContractAddressFromTx(fundingAccount.address, tx.txID ?? '');
    const token = {
      ...contractConfig,
      address,
      hexAddress: base58AddressToHex(address),
      symbol,
    };
    await this.waitForContract(token);
    this.trc20Tokens[symbol] = token;

    return token;
  }

  recordTrc20Balance(
    address: string,
    symbol: TronTrc20Symbol,
    amount: string,
  ): void {
    this.#trc20Balances[address] = {
      ...this.#trc20Balances[address],
      [symbol]: amount,
    };
  }

  async transferTrc20Token(
    token: TronTrc20Token,
    toAddress: string,
    amount: string,
  ): Promise<void> {
    await this.triggerSmartContract({
      contractAddress: token.address,
      ownerAddress: (await this.getFundingAccount()).address,
      parameter: encodeTrc20TransferParameter(toAddress, amount),
    });
  }

  /**
   * Freezes `amountInSun` of TRX from `targetAddress` for ENERGY using
   * Stake 2.0 (`/wallet/freezebalancev2`). The transaction must be signed by
   * the owner — i.e. the private key corresponding to `targetAddress`. The
   * seeder resolves that key from {@link E2E_TEST_ACCOUNT_PRIVATE_KEYS}; if
   * the address is not in that map the call throws — add the BIP44-derived key
   * (`m/44'/195'/0'/0/<index>` from `E2E_SRP`) to `E2E_TEST_ACCOUNT_PRIVATE_KEYS`
   * in node.ts before calling this method with a new test address.
   * @param targetAddress
   * @param amountInSun
   */
  async freezeBalanceV2(
    targetAddress: string,
    amountInSun: string,
  ): Promise<void> {
    const ownerPrivateKey = E2E_TEST_ACCOUNT_PRIVATE_KEYS[targetAddress];
    if (!ownerPrivateKey) {
      throw new Error(
        `freezeBalanceV2: no private key for ${targetAddress}. ` +
          `Add the BIP44-derived key (m/44'/195'/0'/0/<index> from E2E_SRP) ` +
          `to E2E_TEST_ACCOUNT_PRIVATE_KEYS in node.ts.`,
      );
    }

    const tx = await this.fetchJson('/wallet/freezebalancev2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: targetAddress,
        // Tron HTTP API expects a number literal; SUN values in tests are well
        // below Number.MAX_SAFE_INTEGER (~9B TRX) so truncation is not a concern.
        frozen_balance: Number(amountInSun),
        resource: 'ENERGY',
        visible: true,
      }),
    });
    await this.signAndBroadcastTransaction(tx, ownerPrivateKey);
  }

  async triggerSmartContract({
    contractAddress,
    ownerAddress,
    parameter,
  }: {
    contractAddress: string;
    ownerAddress: string;
    parameter: string;
  }): Promise<void> {
    const fundingAccount = await this.getFundingAccount();
    const resp = (await this.fetchJson('/wallet/triggersmartcontract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract_address: contractAddress,
        owner_address: ownerAddress,
        function_selector: 'transfer(address,uint256)',
        parameter,
        fee_limit: 150_000_000,
        call_value: 0,
        visible: true,
      }),
    })) as { transaction?: unknown };

    // /wallet/triggersmartcontract wraps the tx under a "transaction" key
    await this.signAndBroadcastTransaction(
      resp.transaction ?? resp,
      fundingAccount.privateKey,
    );
  }

  private async initializeTrc10Balances(
    balancesByAddress: Record<string, Partial<Record<TronTrc10Symbol, string>>>,
  ): Promise<void> {
    const totals = this.getTokenTotals(balancesByAddress);

    for (const [symbol, totalSupply] of Object.entries(totals)) {
      const token = await this.issueTrc10Token(
        symbol as TronTrc10Symbol,
        totalSupply,
      );
      for (const [address, balances] of Object.entries(balancesByAddress)) {
        const amount = balances[symbol as TronTrc10Symbol];
        if (amount) {
          await this.transferTrc10Token(token, address, amount);
          this.#trc10Balances[address] = {
            ...this.#trc10Balances[address],
            [symbol]: amount,
          };
        }
      }
    }
  }

  private async initializeStakedTrxBalances(
    balancesByAddress: Record<string, string>,
  ): Promise<void> {
    for (const [address, amountInSun] of Object.entries(balancesByAddress)) {
      if (BigInt(amountInSun) > 0n) {
        await this.freezeBalanceV2(address, amountInSun);
        this.#stakedTrxBalances[address] = amountInSun;
      }
    }
  }

  private async initializeTrc20Balances(
    balancesByAddress: Record<string, Partial<Record<TronTrc20Symbol, string>>>,
  ): Promise<void> {
    const totals = this.getTokenTotals(balancesByAddress);

    for (const symbol of Object.keys(totals) as TronTrc20Symbol[]) {
      const token = await this.deployTrc20Token(symbol, totals[symbol]);
      for (const [address, balances] of Object.entries(balancesByAddress)) {
        const amount = balances[symbol];
        if (amount) {
          await this.transferTrc20Token(token, address, amount);
          this.recordTrc20Balance(address, symbol, amount);
        }
      }
    }
  }

  private getTokenTotals<T extends string>(
    balancesByAddress: Record<string, Partial<Record<T, string>>>,
  ): Partial<Record<T, string>> {
    const totals: Partial<Record<T, string>> = {};
    for (const balances of Object.values(balancesByAddress)) {
      for (const [symbol, amount] of Object.entries(balances) as [
        T,
        string,
      ][]) {
        totals[symbol] = (
          BigInt(totals[symbol] ?? '0') + BigInt(amount)
        ).toString();
      }
    }

    return totals;
  }

  private async signAndBroadcastTransaction(
    tx: unknown,
    privateKey: string,
  ): Promise<void> {
    const transaction = tx as {
      raw_data_hex?: string;
      txID?: string;
      [key: string]: unknown;
    };

    if (!transaction.raw_data_hex) {
      throw new Error(`Transaction creation failed: ${JSON.stringify(tx)}`);
    }

    // Sign: SHA256(raw_data_bytes) -> secp256k1 -> 65-byte sig (r||s||v).
    const rawBytes = Buffer.from(transaction.raw_data_hex, 'hex');
    const hash = sha256(rawBytes);
    const privKeyBytes = Buffer.from(privateKey, 'hex');
    const sig = secp256k1.sign(hash, privKeyBytes);
    const sigBytes = new Uint8Array(65);
    sigBytes.set(sig.toCompactRawBytes());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    sigBytes[64] = sig.recovery!;
    const signatureHex = Buffer.from(sigBytes).toString('hex');

    const broadcastResp = await fetch(
      `${this.baseUrl}/wallet/broadcasttransaction`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transaction,
          signature: [signatureHex],
          visible: true,
        }),
      },
    );
    if (!broadcastResp.ok) {
      throw new Error(
        `broadcasttransaction HTTP ${broadcastResp.status}: ${await broadcastResp.text()}`,
      );
    }
    const result = (await broadcastResp.json()) as {
      result?: boolean;
      txid?: string;
      [key: string]: unknown;
    };

    if (!result.result) {
      throw new Error(`broadcasttransaction failed: ${JSON.stringify(result)}`);
    }

    await this.waitForTransaction(result.txid ?? transaction.txID);
  }

  private async waitForTransaction(txId?: string): Promise<void> {
    if (!txId) {
      await new Promise((r) => setTimeout(r, 3_500));
      return;
    }
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const checkResp = await fetch(
        `${this.baseUrl}/wallet/gettransactionbyid?value=${txId}`,
      );
      const checkData = (await checkResp.json()) as { txID?: string };
      if (checkData.txID) {
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Transaction ${txId} was not confirmed within 30s`);
  }

  private async waitForContract(token: TronTrc20Token): Promise<void> {
    const deadline = Date.now() + 30_000;
    const requests = [
      { value: token.address, visible: true },
      { value: token.hexAddress, visible: false },
    ];

    while (Date.now() < deadline) {
      for (const request of requests) {
        try {
          const contract = (await this.fetchJson('/wallet/getcontract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
            timeoutMs: 5_000,
          })) as Record<string, unknown>;
          if (
            !contract.Error &&
            (contract.contract_address || contract.abi || contract.bytecode)
          ) {
            return;
          }
        } catch {
          // The contract is not indexed yet for this address representation.
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    throw new Error(`Contract ${token.address} was not available within 30s`);
  }

  async getFundingAccount(): Promise<TronFundingAccount> {
    if (this.#fundingAccount) {
      return this.#fundingAccount;
    }

    this.#fundingAccount = {
      address: JAVA_TRON_GENESIS_ADDRESS,
      privateKey: JAVA_TRON_GENESIS_PRIVATE_KEY,
    };

    return this.#fundingAccount;
  }

  deriveAddressFromPrivateKey(privateKeyHex: string): string {
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    const publicKey = secp256k1.getPublicKey(privateKeyBytes, false);
    const publicKeyHash = keccak256(publicKey.slice(1));
    const tronAddressPayload = Buffer.concat([
      Buffer.from([0x41]),
      Buffer.from(publicKeyHash.slice(-20)),
    ]);
    const checksum = Buffer.from(
      sha256(sha256(tronAddressPayload)).slice(0, 4),
    );

    return bs58.encode(Buffer.concat([tronAddressPayload, checksum]));
  }

  async fetchJson(
    path: string,
    { timeoutMs = 15_000, ...init }: FetchJsonOptions = {},
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(
        `${path} failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }

    return await response.json();
  }

  #formatProcessOutput(): string {
    return formatProcessOutput(this.#stdout, this.#stderr);
  }

  #throwIfNodeExited(): void {
    if (this.#nodeProcessExitError) {
      throw this.#nodeProcessExitError;
    }
  }
}

function getPackageBinaryPath(command: string): string {
  return resolve(process.cwd(), 'node_modules', '.bin', command);
}

function appendProcessOutput(output: string, chunk: Buffer): string {
  return `${output}${chunk.toString()}`.slice(-JAVA_TRON_PROCESS_OUTPUT_LIMIT);
}

function formatProcessOutput(stdout: string, stderr: string): string {
  const sections = [];
  if (stdout.trim()) {
    sections.push(`\nstdout:\n${stdout.trim()}`);
  }
  if (stderr.trim()) {
    sections.push(`\nstderr:\n${stderr.trim()}`);
  }
  return sections.join('');
}

export async function resolveJavaTronPrivateNetworkPorts(
  ports: Partial<JavaTronPrivateNetworkPorts> = {},
): Promise<JavaTronPrivateNetworkPorts> {
  const explicitPortEntries = JAVA_TRON_PRIVATE_NETWORK_PORT_KEYS.flatMap(
    (key) => {
      const port = ports[key];
      return port === undefined ? [] : [[key, port] as const];
    },
  );
  const explicitPorts = explicitPortEntries.map(([, port]) => port);
  const seenPorts = new Map<number, keyof JavaTronPrivateNetworkPorts>();

  for (const [key, port] of explicitPortEntries) {
    const label = JAVA_TRON_PRIVATE_NETWORK_PORT_LABELS[key];
    assertValidPort(port, label);

    const duplicateKey = seenPorts.get(port);
    if (duplicateKey) {
      throw new Error(
        `${label} must be different from ${
          JAVA_TRON_PRIVATE_NETWORK_PORT_LABELS[duplicateKey]
        }`,
      );
    }
    seenPorts.set(port, key);
  }

  for (const [key, port] of explicitPortEntries) {
    if (!(await isTcpPortAvailable(port))) {
      throw new Error(
        `${JAVA_TRON_PRIVATE_NETWORK_PORT_LABELS[key]} ${port} is already in use`,
      );
    }
  }

  const missingPortKeys = JAVA_TRON_PRIVATE_NETWORK_PORT_KEYS.filter(
    (key) => ports[key] === undefined,
  );
  const allocatedPorts = await getAvailablePorts(
    missingPortKeys.length,
    explicitPorts,
  );
  const resolvedPorts = { ...ports };

  for (const key of missingPortKeys) {
    const port = allocatedPorts.shift();
    if (port === undefined) {
      throw new Error('Unable to allocate java-tron private network ports');
    }
    resolvedPorts[key] = port;
  }

  return resolvedPorts as JavaTronPrivateNetworkPorts;
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
      }, 5_000);
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
