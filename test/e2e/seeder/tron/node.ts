/* eslint-disable @typescript-eslint/naming-convention */
import { spawn, type ChildProcess } from 'child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { createRequire } from 'module';
import { installJavaTron } from '@metamask/java-tron-up';
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

type TronTransactionInfoResponse = {
  id?: string;
  blockNumber?: number;
  result?: 'SUCESS' | 'FAILED' | string;
  receipt?: {
    result?: 'SUCCESS' | string;
    [key: string]: unknown;
  };
  resMessage?: string;
  [key: string]: unknown;
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

  async start(options: TronLocalNodeOptions = {}): Promise<void> {
    if (this.#nodeProcess || this.#runtimeDirectory || this.#fullNodePort) {
      throw new Error('Tron local node has already started');
    }

    this.#resetSeederState();

    try {
      await this.#startNativeJavaTron(options.ports);
      await this.waitForReady(120_000);

      for (const [address, amountInSun] of Object.entries(
        options.initialBalances ?? {},
      )) {
        if (amountInSun > 0) {
          await this.fundAccount(address, amountInSun);
        }
      }

      // TRC10 issuance and TRC20 deployment both sign from the genesis
      // funding account; running them concurrently risks conflicting
      // transactions from that single account, so these stages are
      // serialized. Transfers *within* each stage stay concurrent (see the
      // comments in initializeTrc10Balances/initializeTrc20Balances).
      await this.initializeTrc10Balances(options.trc10Balances ?? {});
      await this.initializeTrc20Balances(options.trc20Balances ?? {});
      await this.initializeStakedTrxBalances(options.stakedTrxBalances ?? {});
    } catch (error) {
      await this.quit();
      throw error;
    }
  }

  async #startNativeJavaTron(
    ports: TronLocalNodeOptions['ports'] = {},
  ): Promise<void> {
    await installJavaTron({ cwd: process.cwd() });

    const runtimeDirectory = await mkdtemp(join(tmpdir(), 'java-tron-e2e-'));
    try {
      const configPath = join(runtimeDirectory, 'fullnode.conf');
      const outputDirectory = join(runtimeDirectory, 'output');
      const resolvedPorts = await resolveJavaTronPrivateNetworkPorts(ports);
      // getAvailablePorts probes ports by briefly binding then releasing them,
      // which leaves a gap where another process could grab one before we
      // spawn java-tron. Re-check right before use to fail fast instead of
      // waiting out the full waitForReady timeout on a silent bind failure.
      for (const key of JAVA_TRON_PRIVATE_NETWORK_PORT_KEYS) {
        const port = resolvedPorts[key];
        if (!(await isTcpPortAvailable(port))) {
          throw new Error(
            `${JAVA_TRON_PRIVATE_NETWORK_PORT_LABELS[key]} ${port} is no longer available`,
          );
        }
      }
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
      const nodeProcess = spawn(
        javaTronBinary,
        ['-c', configPath, '--witness', '-d', outputDirectory],
        {
          cwd: runtimeDirectory,
          detached: process.platform !== 'win32',
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            JAVA_TOOL_OPTIONS: '-Xmx512m -Xms512m -XX:+TieredCompilation',
          },
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
    } catch (error) {
      if (this.#runtimeDirectory !== runtimeDirectory) {
        await rm(runtimeDirectory, { force: true, recursive: true });
      }
      throw error;
    }
  }

  async quit(): Promise<void> {
    const nodeProcess = this.#nodeProcess;
    const runtimeDirectory = this.#runtimeDirectory;
    this.#fullNodePort = undefined;
    this.#nodeProcess = undefined;
    this.#runtimeDirectory = undefined;

    try {
      if (nodeProcess) {
        await stopProcess(nodeProcess);
      }

      if (runtimeDirectory) {
        await rm(runtimeDirectory, { force: true, recursive: true });
      }
    } finally {
      this.#resetSeederState();
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
    const tx = (await this.fetchJson('/wallet/createtransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fundingAccount.address,
        to_address: toAddress,
        amount: amountInSun,
        visible: true,
      }),
      timeoutMs: 15_000,
    })) as {
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
        abbr: metadata.abbr ?? metadata.symbol,
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
    const ownerPrivateKey =
      ownerAddress === fundingAccount.address
        ? fundingAccount.privateKey
        : E2E_TEST_ACCOUNT_PRIVATE_KEYS[ownerAddress];
    if (!ownerPrivateKey) {
      throw new Error(
        `triggerSmartContract: no private key for ${ownerAddress}. ` +
          `Add the BIP44-derived key (m/44'/195'/0'/0/<index> from E2E_SRP) ` +
          `to E2E_TEST_ACCOUNT_PRIVATE_KEYS in node.ts.`,
      );
    }

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

    await this.signAndBroadcastTransaction(
      resp.transaction ?? resp,
      ownerPrivateKey,
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
      await Promise.all(
        Object.entries(balancesByAddress).flatMap(([address, balances]) => {
          const amount = balances[symbol as TronTrc10Symbol];
          if (!amount) {
            return [];
          }
          return [
            this.transferTrc10Token(token, address, amount).then(() => {
              this.#trc10Balances[address] = {
                ...this.#trc10Balances[address],
                [symbol]: amount,
              };
            }),
          ];
        }),
      );
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
      // Java-Tron uses expiration-based (not nonce-based) sequencing; concurrent
      // transfers from the genesis account are expected to succeed. If flakiness
      // appears, serialize this back to a sequential for...of loop.
      await Promise.all(
        Object.entries(balancesByAddress).flatMap(([address, balances]) => {
          const amount = balances[symbol];
          if (!amount) {
            return [];
          }
          return [
            this.transferTrc20Token(token, address, amount).then(() => {
              this.recordTrc20Balance(address, symbol, amount);
            }),
          ];
        }),
      );
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

    const result = (await this.fetchJson('/wallet/broadcasttransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...transaction,
        signature: [signatureHex],
        visible: true,
      }),
      timeoutMs: 15_000,
    })) as {
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
      let checkData: TronTransactionInfoResponse;
      try {
        checkData = (await this.fetchJson(
          `/wallet/gettransactioninfobyid?value=${txId}`,
          { timeoutMs: 5_000 },
        )) as TronTransactionInfoResponse;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      if (checkData.id) {
        assertSuccessfulJavaTronTransaction(txId, checkData);
        if (checkData.blockNumber !== undefined) {
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 250));
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

  #resetSeederState(): void {
    this.#fundingAccount = undefined;
    clearRecord(this.#trc10Balances);
    clearRecord(this.#trc20Balances);
    clearRecord(this.#stakedTrxBalances);
    clearRecord(this.trc10Tokens);
    clearRecord(this.trc20Tokens);
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

function assertSuccessfulJavaTronTransaction(
  txId: string,
  transactionInfo: TronTransactionInfoResponse,
): void {
  const transactionResult = transactionInfo.result;
  const receiptResult = transactionInfo.receipt?.result;
  const failed =
    transactionResult === 'FAILED' ||
    (receiptResult !== undefined && receiptResult !== 'SUCCESS');

  if (!failed) {
    return;
  }

  const reason =
    typeof transactionInfo.resMessage === 'string' &&
    transactionInfo.resMessage.length > 0
      ? `: ${transactionInfo.resMessage}`
      : '';
  throw new Error(
    `Transaction ${txId} failed${reason}. Transaction info: ${JSON.stringify(
      transactionInfo,
    )}`,
  );
}

function clearRecord(record: object): void {
  for (const key of Object.keys(record)) {
    delete (record as Record<string, unknown>)[key];
  }
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
