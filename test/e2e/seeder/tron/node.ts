/* eslint-disable @typescript-eslint/naming-convention */
import { execSync } from 'child_process';
import bs58 from 'bs58';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { sha256 } from 'ethereum-cryptography/sha256';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';

const CONTAINER_NAME = 'tron-tre-e2e';
const HTTP_PORT = 9090;

export const TRON_LOCAL_NODE_URL = `http://localhost:${HTTP_PORT}`;

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

  readonly baseUrl = TRON_LOCAL_NODE_URL;

  /**
   * Starts a TronBox Runtime Environment (TRE) Docker container, waits for it
   * to finish generating prefunded accounts, and seeds any requested balances
   * into the MetaMask-controlled Tron account. This keeps the same async
   * start() contract that Ganache and Anvil expose to withFixtures.
   *
   * @param options - Start options.
   * @param options.initialBalances - Map of Tron address to amount in SUN to
   * fund from TRE's first prefunded account after the node is ready.
   */
  async start(
    options: { initialBalances?: Record<string, number> } = {},
  ): Promise<void> {
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
      await this.fundAccount(address, amountInSun);
    }
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

    // 2. Sign: SHA256(raw_data_bytes) → secp256k1 → 65-byte sig (r||s||v)
    //    Tron uses SHA256 (not keccak), same secp256k1 curve as Ethereum
    const rawBytes = Buffer.from(tx.raw_data_hex, 'hex');
    const hash = sha256(rawBytes);
    const privKeyBytes = Buffer.from(fundingAccount.privateKey, 'hex');
    const sig = secp256k1.sign(hash, privKeyBytes);
    // Layout: r (32 bytes) || s (32 bytes) || recovery (1 byte)
    const sigBytes = new Uint8Array(65);
    sigBytes.set(sig.toCompactRawBytes());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    sigBytes[64] = sig.recovery!;
    const signatureHex = Buffer.from(sigBytes).toString('hex');

    // 3. Broadcast the signed transaction
    const broadcastResp = await fetch(
      `${this.baseUrl}/wallet/broadcasttransaction`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tx,
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

    // Poll until the transaction is confirmed on-chain (up to 30 s)
    const txId = result.txid;
    if (txId) {
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
    // If no txId in response, fall back to a single block wait
    await new Promise((r) => setTimeout(r, 3_500));
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
