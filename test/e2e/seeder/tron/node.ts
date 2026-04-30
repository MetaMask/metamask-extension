/* eslint-disable @typescript-eslint/naming-convention */
/**
 * @file node.ts — Tron local node seeder
 *
 * ## Why Docker stays (audit 2026-04-30, tronbox@4.7.0)
 *
 * Goal: replace `docker run tronbox/tre` with a node-spawned process using the
 * `tronbox` npm package, so contributors do not need Docker installed locally.
 *
 * ### Audit findings
 *
 * The `tronbox` npm package (latest = 4.7.0, audited via `yarn npm info tronbox`)
 * is a **smart-contract development framework** (compile, migrate, deploy, test,
 * console, flatten, unbox, help, version).  It does **not** ship a `tre`
 * subcommand or any equivalent that boots a local Tron node.
 *
 * TRE (TronBox Runtime Environment) is a **separate Docker image**:
 * https://hub.docker.com/r/tronbox/tre
 *
 * The tronbox repository itself documents this explicitly — the test suite for
 * TRE interactions contains the comment:
 *   "The following tests require TronBox >= 3.0.0 and
 *    TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre)"
 * (see tronprotocol/tronbox: test/tre/test/tre.js)
 *
 * The official TronBox documentation at https://tronbox.io/docs/ states:
 *   "When using this network on TronBox, you need to use Docker to pull the image."
 *
 * The `bin` entry in the npm package manifest is:
 *   { "tronbox": "build/tronbox.js" }
 * which resolves to the framework CLI only — no `tronbox tre` command exists.
 *
 * ### What would unblock migration
 *
 * Migration to a Docker-free approach would become possible if either:
 * 1. The tronbox npm package adds a `tre` (or equivalent) subcommand that
 *    starts the full TRE node natively without Docker, OR
 * 2. A standalone npm package is published that wraps the `tronbox/tre` Docker
 *    image's Java-based Tron node as a native binary (e.g. via a prebuilt binary
 *    distribution, similar to how `hardhat` bundles its own EVM).
 *
 * Until either of those upstream changes lands, Docker is the only supported
 * way to run TRE locally and in CI.  The existing `execSync('docker run …')` /
 * `execSync('docker rm -f …')` calls in `start()` and `quit()` are intentionally
 * left unchanged.
 */
import { execSync } from 'child_process';
import bs58 from 'bs58';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { sha256 } from 'ethereum-cryptography/sha256';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';
import {
  TRON_TEST_ASSETS,
  TronLocalNodeOptions,
  TronNativeAccount,
  TronTrc10Symbol,
  TronTrc10Token,
  TronTrc20Symbol,
  TronTrc20Token,
  base58AddressToHex,
  buildPermissiveTrc20Bytecode,
  createTronGridAccountResponse,
  encodeTrc20TransferParameter,
  getContractAddressFromTx,
  hexAddressToBase58,
  normalizeTronHexAddress,
} from './assets';

const CONTAINER_NAME = 'tron-tre-e2e';
const HTTP_PORT = 9090;

export const TRON_LOCAL_NODE_URL = `http://localhost:${HTTP_PORT}`;

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

type TreAccountsResponse = {
  privateKeys?: string[];
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

  readonly #trc10Balances: Record<
    string,
    Partial<Record<TronTrc10Symbol, string>>
  > = {};

  readonly #trc20Balances: Record<
    string,
    Partial<Record<TronTrc20Symbol, string>>
  > = {};

  readonly #stakedTrxBalances: Record<string, string> = {};

  readonly baseUrl = TRON_LOCAL_NODE_URL;

  readonly trc10Tokens: Partial<Record<TronTrc10Symbol, TronTrc10Token>> = {};

  readonly trc20Tokens: Partial<Record<TronTrc20Symbol, TronTrc20Token>> = {};

  /**
   * Starts a TronBox Runtime Environment (TRE) Docker container, waits for it
   * to finish generating prefunded accounts, and seeds any requested balances
   * into the MetaMask-controlled Tron account. This keeps the same async
   * start() contract that Ganache and Anvil expose to withFixtures.
   *
   * @param options - Start options.
   * @param options.initialBalances - Map of Tron address to amount in SUN.
   * @param options.trc10Balances - Map of Tron address to named TRC10 balances.
   * @param options.trc20Balances - Map of Tron address to named TRC20 balances.
   * @param options.stakedTrxBalances - Map of Tron address to staked TRX in SUN.
   * @param options.trc721Balances - Accepted and ignored placeholder for TRC721.
   * @param options.trc1155Balances - Accepted and ignored placeholder for TRC1155.
   */
  async start(options: TronLocalNodeOptions = {}): Promise<void> {
    this.#fundingAccount = undefined;

    // Remove any leftover TRE container from a previous run so we can safely
    // rebind port 9090.
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'pipe' });
    } catch {
      // Container didn't exist — that's fine
    }

    execSync(
      [
        'docker run -d',
        '--rm',
        `--name ${CONTAINER_NAME}`,
        `-p ${HTTP_PORT}:9090`,
        'tronbox/tre',
      ].join(' '),
      { stdio: 'pipe' },
    );

    await this.waitForReady(120_000);

    for (const [address, amountInSun] of Object.entries(
      options.initialBalances ?? {},
    )) {
      if (amountInSun > 0) {
        await this.fundAccount(address, amountInSun);
      }
    }

    await this.initializeTrc10Balances(options.trc10Balances ?? {});
    await this.initializeTrc20Balances(options.trc20Balances ?? {});

    await this.initializeStakedTrxBalances(options.stakedTrxBalances ?? {});
    // `trc721Balances` and `trc1155Balances` are accepted and ignored — see the
    // JSDoc on TronLocalNodeOptions.
  }

  async quit(): Promise<void> {
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'pipe' });
    } catch {
      // Already gone
    }
  }

  async waitForReady(timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const data = (await this.fetchJson('/wallet/getnowblock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
          timeoutMs: 5_000,
        })) as { block_header?: unknown };
        const accounts = await this.getTreAccounts();
        if (
          data.block_header &&
          accounts.privateKeys?.length &&
          (await this.hasFundedTreAccount())
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

  async hasFundedTreAccount(): Promise<boolean> {
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
          `Check that the TRE funding address (${fundingAccount.address}) is funded and the node has produced at least one block.`,
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
        name: Buffer.from(metadata.name).toString('hex'),
        abbr: Buffer.from(metadata.symbol).toString('hex'),
        description: Buffer.from(metadata.name).toString('hex'),
        url: Buffer.from('https://metamask.io').toString('hex'),
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

  async deployTrc20Token(symbol: TronTrc20Symbol): Promise<TronTrc20Token> {
    const metadata = TRON_TEST_ASSETS[symbol];
    const fundingAccount = await this.getFundingAccount();
    const tx = (await this.fetchJson('/wallet/deploycontract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fundingAccount.address,
        name: metadata.symbol,
        abi: JSON.stringify([
          {
            name: 'transfer',
            type: 'Function',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ type: 'bool' }],
          },
          {
            name: 'balanceOf',
            type: 'Function',
            inputs: [{ name: 'owner', type: 'address' }],
            outputs: [{ type: 'uint256' }],
            constant: true,
          },
          {
            name: 'decimals',
            type: 'Function',
            inputs: [],
            outputs: [{ type: 'uint8' }],
            constant: true,
          },
        ]),
        bytecode: buildPermissiveTrc20Bytecode(metadata.decimals),
        call_value: 0,
        consume_user_resource_percent: 100,
        fee_limit: 150_000_000,
        origin_energy_limit: 10_000_000,
        visible: true,
      }),
    })) as {
      contract_address?: string;
      txID?: string;
    };
    await this.signAndBroadcastTransaction(tx, fundingAccount.privateKey);

    const address =
      tx.contract_address && normalizeTronHexAddress(tx.contract_address)
        ? hexAddressToBase58(normalizeTronHexAddress(tx.contract_address))
        : getContractAddressFromTx(fundingAccount.address, tx.txID ?? '');
    const token = {
      ...metadata,
      address,
      hexAddress: base58AddressToHex(address),
      symbol,
    };
    this.trc20Tokens[symbol] = token;

    return token;
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
    const tx = await this.fetchJson('/wallet/triggersmartcontract', {
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
    });

    await this.signAndBroadcastTransaction(tx, fundingAccount.privateKey);
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
      const token = await this.deployTrc20Token(symbol);
      for (const [address, balances] of Object.entries(balancesByAddress)) {
        const amount = balances[symbol];
        if (amount) {
          await this.transferTrc20Token(token, address, amount);
          this.#trc20Balances[address] = {
            ...this.#trc20Balances[address],
            [symbol]: amount,
          };
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

  async getFundingAccount(): Promise<TronFundingAccount> {
    if (this.#fundingAccount) {
      return this.#fundingAccount;
    }

    const accounts = await this.getTreAccounts();
    const privateKey = accounts.privateKeys?.[0];

    if (!privateKey) {
      throw new Error('TRE did not expose any prefunded private keys');
    }

    this.#fundingAccount = {
      address: this.deriveAddressFromPrivateKey(privateKey),
      privateKey,
    };

    return this.#fundingAccount;
  }

  async getTreAccounts(): Promise<TreAccountsResponse> {
    return (await this.fetchJson('/admin/accounts-json', {
      timeoutMs: 5_000,
    })) as TreAccountsResponse;
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
}
