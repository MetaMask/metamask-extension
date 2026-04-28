/* eslint-disable @typescript-eslint/naming-convention */
import { execSync } from 'child_process';
import { join } from 'path';
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

// Must match the `localwitness` entry in tron/config/private_net_config.conf
// Zion witness account from genesis block (95 billion TRX in private chain)
const GENESIS_PRIVATE_KEY =
  'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0';
const GENESIS_ADDRESS = 'TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY';

const CONTAINER_NAME = 'tron-private-e2e';
const HTTP_PORT = 18090;
const CONFIG_DIR = join(__dirname, 'config');

export const TRON_LOCAL_NODE_URL = `http://localhost:${HTTP_PORT}`;

export class TronNode {
  readonly #trc10Balances: Record<
    string,
    Partial<Record<TronTrc10Symbol, string>>
  > = {};

  readonly #trc20Balances: Record<
    string,
    Partial<Record<TronTrc20Symbol, string>>
  > = {};

  readonly baseUrl = TRON_LOCAL_NODE_URL;

  readonly trc10Tokens: Partial<Record<TronTrc10Symbol, TronTrc10Token>> = {};

  readonly trc20Tokens: Partial<Record<TronTrc20Symbol, TronTrc20Token>> = {};

  /**
   * Starts the java-tron Docker container, waits for the node to be ready,
   * and seeds any requested initial balances — matching the async start()
   * contract used by Ganache and Anvil so that withFixtures can manage the
   * lifecycle automatically.
   *
   * @param options - Start options.
   * @param options.initialBalances - Map of Tron address to amount in SUN.
   * @param options.trc10Balances - Map of Tron address to named TRC10 balances.
   * @param options.trc20Balances - Map of Tron address to named TRC20 balances.
   */
  async start(options: TronLocalNodeOptions = {}): Promise<void> {
    // Remove any leftover container and stale blockchain data from a previous
    // run. Both must be cleared together: the container holds port 18090, and
    // the data directory holds chain state that would inflate account balances
    // if reused (fundAccount would add on top of an existing balance).
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'pipe' });
    } catch {
      // Container didn't exist — that's fine
    }
    try {
      execSync('rm -rf /tmp/tron-output-e2e', { stdio: 'pipe' });
    } catch {
      // Directory didn't exist — that's fine
    }

    execSync(
      [
        'docker run -d',
        `--name ${CONTAINER_NAME}`,
        `-v ${CONFIG_DIR}:/java-tron/config`,
        `-v /tmp/tron-output-e2e:/java-tron/output-directory`,
        `-p ${HTTP_PORT}:16667`,
        'tronprotocol/java-tron:latest',
        '-c /java-tron/config/private_net_config.conf --witness',
      ].join(' '),
      { stdio: 'pipe' },
    );

    await this.waitForReady(90_000);

    for (const [address, amountInSun] of Object.entries(
      options.initialBalances ?? {},
    )) {
      if (amountInSun > 0) {
        await this.fundAccount(address, amountInSun);
      }
    }

    await this.initializeTrc10Balances(options.trc10Balances ?? {});
    await this.initializeTrc20Balances(options.trc20Balances ?? {});
  }

  async quit(): Promise<void> {
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'pipe' });
    } catch {
      // Already gone
    }
    try {
      execSync('rm -rf /tmp/tron-output-e2e', { stdio: 'pipe' });
    } catch {
      // Ignore
    }
  }

  async waitForReady(timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const resp = await fetch(`${this.baseUrl}/wallet/getnowblock`);
        const data = (await resp.json()) as { block_header?: unknown };
        if (data.block_header) {
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

  async fundAccount(toAddress: string, amountInSun: number): Promise<void> {
    // 1. Build an unsigned TransferContract transaction
    const createResp = await fetch(`${this.baseUrl}/wallet/createtransaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: GENESIS_ADDRESS,
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
          `Check that the genesis address (${GENESIS_ADDRESS}) is funded and the node has produced at least one block.`,
      );
    }

    await this.signAndBroadcastTransaction(tx, GENESIS_PRIVATE_KEY);
  }

  getTrc10Balances(address: string): Partial<Record<TronTrc10Symbol, string>> {
    return this.#trc10Balances[address] ?? {};
  }

  getTrc20Balances(address: string): Partial<Record<TronTrc20Symbol, string>> {
    return this.#trc20Balances[address] ?? {};
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
    const now = Date.now();
    const tx = await this.fetchJson('/wallet/createassetissue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: GENESIS_ADDRESS,
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
    await this.signAndBroadcastTransaction(tx, GENESIS_PRIVATE_KEY);

    const account = (await this.fetchJson('/wallet/getaccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: GENESIS_ADDRESS, visible: true }),
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
    const tx = await this.fetchJson('/wallet/transferasset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: GENESIS_ADDRESS,
        to_address: toAddress,
        asset_name: token.tokenId,
        amount: Number(amount),
        visible: true,
      }),
    });
    await this.signAndBroadcastTransaction(tx, GENESIS_PRIVATE_KEY);
  }

  async deployTrc20Token(symbol: TronTrc20Symbol): Promise<TronTrc20Token> {
    const metadata = TRON_TEST_ASSETS[symbol];
    const tx = (await this.fetchJson('/wallet/deploycontract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: GENESIS_ADDRESS,
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
    await this.signAndBroadcastTransaction(tx, GENESIS_PRIVATE_KEY);

    const address =
      tx.contract_address && normalizeTronHexAddress(tx.contract_address)
        ? hexAddressToBase58(normalizeTronHexAddress(tx.contract_address))
        : getContractAddressFromTx(GENESIS_ADDRESS, tx.txID ?? '');
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
      ownerAddress: GENESIS_ADDRESS,
      parameter: encodeTrc20TransferParameter(toAddress, amount),
    });
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

    await this.signAndBroadcastTransaction(tx, GENESIS_PRIVATE_KEY);
  }

  async fetchJson(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, init);

    if (!response.ok) {
      throw new Error(
        `${path} failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }

    return await response.json();
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
}
