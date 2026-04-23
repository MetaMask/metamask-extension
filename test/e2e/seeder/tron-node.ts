/* eslint-disable @typescript-eslint/naming-convention */
import { execSync } from 'child_process';
import { join } from 'path';
import { sha256 } from 'ethereum-cryptography/sha256';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';

// Must match the `localwitness` entry in tron-config/private_net_config.conf
// Zion witness account from genesis block (95 billion TRX in private chain)
const GENESIS_PRIVATE_KEY =
  'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0';
const GENESIS_ADDRESS = 'TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY';

const CONTAINER_NAME = 'tron-private-e2e';
const HTTP_PORT = 18090;
const CONFIG_DIR = join(__dirname, 'tron-config');

export class TronNode {
  readonly baseUrl = `http://localhost:${HTTP_PORT}`;

  start(): void {
    // Remove any leftover container from a previous run
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'pipe' });
    } catch {
      // Container didn't exist — that's fine
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
  }

  stop(): void {
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

    // 2. Sign: SHA256(raw_data_bytes) → secp256k1 → 65-byte sig (r||s||v)
    //    Tron uses SHA256 (not keccak), same secp256k1 curve as Ethereum
    const rawBytes = Buffer.from(tx.raw_data_hex, 'hex');
    const hash = sha256(rawBytes);
    const privKeyBytes = Buffer.from(GENESIS_PRIVATE_KEY, 'hex');
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
}
