/**
 * @file assets.ts — Seed classic Stellar trustlines on Quickstart `--local`.
 *
 * Submits change-trust / payment with the standalone network passphrase
 * (wallet snap still signs pubnet, so UI activate/deactivate submit is out
 * of scope). Local issuers are random keypairs — Tokens API mocks must
 * advertise the resulting CAIP-19 ids or balances stay hidden in the list.
 */
// eslint-disable-next-line import-x/no-extraneous-dependencies -- e2e seeder; same as stellar mocks
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { getE2eStellarKeypair } from './keys';
import { StellarNode } from './node';

export type SeededClassicTrustline = {
  assetCode: string;
  assetIssuer: string;
  balance: string;
  name: string;
  symbol: string;
};

export type SeedClassicTrustlineSpec = {
  assetCode: string;
  /** Horizon payment amount; omit or `'0'` for a zero-balance trustline. */
  balance?: string;
  name?: string;
  symbol?: string;
};

/**
 * Default portfolio matching the mocked assets E2E: funded USDC + zero EURC.
 * Issuers are local Quickstart accounts, not Circle pubnet issuers.
 */
export const STELLAR_LOCAL_PORTFOLIO_TRUSTLINES: readonly SeedClassicTrustlineSpec[] =
  [
    { assetCode: 'USDC', balance: '25', name: 'USDC', symbol: 'USDC' },
    { assetCode: 'EURC', balance: '0', name: 'EURC', symbol: 'EURC' },
  ];

const STELLAR_CAIP_CHAIN_ID = 'stellar:pubnet';

/**
 * Tokens API row for a seeded classic trustline. Local issuer ids must be
 * advertised or `assetsUnifyState` hides the balance in the token list.
 *
 * @param trustline - Seeded classic asset
 * @returns Tokens API metadata
 */
export function toStellarTokenMetadata(trustline: SeededClassicTrustline): {
  assetId: string;
  decimals: number;
  name: string;
  symbol: string;
} {
  return {
    assetId: `${STELLAR_CAIP_CHAIN_ID}/asset:${trustline.assetCode}-${trustline.assetIssuer}`,
    decimals: 7,
    name: trustline.name,
    symbol: trustline.symbol,
  };
}

/**
 * Friendbot-funds issuers, opens classic trustlines from the E2E wallet, and
 * pays non-zero balances. Wallet must already exist on Horizon (Friendbot).
 *
 * @param stellarNode - Started Quickstart node
 * @param walletAddress - Expected G… address (Account 1 / index 0 by default)
 * @param trustlines - Classic assets to seed
 * @returns Seeded trustlines with local issuer public keys
 */
export async function seedStellarClassicTrustlines(
  stellarNode: StellarNode,
  walletAddress: string,
  trustlines: readonly SeedClassicTrustlineSpec[] = STELLAR_LOCAL_PORTFOLIO_TRUSTLINES,
): Promise<SeededClassicTrustline[]> {
  const wallet = await getE2eStellarKeypair(0);
  if (wallet.publicKey() !== walletAddress) {
    throw new Error(
      `E2E Stellar keypair ${wallet.publicKey()} does not match ${walletAddress}`,
    );
  }

  const networkPassphrase = await stellarNode.getNetworkPassphrase();
  const server = new Horizon.Server(stellarNode.horizonUrl, {
    allowHttp: true,
  });

  const seeded: SeededClassicTrustline[] = [];
  const changeTrustOps: Parameters<TransactionBuilder['addOperation']>[0][] =
    [];
  const payments: { issuer: Keypair; asset: Asset; amount: string }[] = [];

  for (const spec of trustlines) {
    const issuer = Keypair.random();
    await stellarNode.fundAccount(issuer.publicKey());
    const asset = new Asset(spec.assetCode, issuer.publicKey());
    const balance = spec.balance ?? '0';
    changeTrustOps.push(Operation.changeTrust({ asset }));
    if (Number(balance) > 0) {
      payments.push({ issuer, asset, amount: balance });
    }
    seeded.push({
      assetCode: spec.assetCode,
      assetIssuer: issuer.publicKey(),
      balance,
      name: spec.name ?? spec.assetCode,
      symbol: spec.symbol ?? spec.assetCode,
    });
  }

  await submitOperations(server, wallet, networkPassphrase, changeTrustOps);

  for (const payment of payments) {
    await submitOperations(server, payment.issuer, networkPassphrase, [
      Operation.payment({
        destination: walletAddress,
        asset: payment.asset,
        amount: payment.amount,
      }),
    ]);
  }

  return seeded;
}

async function submitOperations(
  server: Horizon.Server,
  source: Keypair,
  networkPassphrase: string,
  operations: Parameters<TransactionBuilder['addOperation']>[0][],
): Promise<void> {
  if (operations.length === 0) {
    return;
  }

  const account = await server.loadAccount(source.publicKey());
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  });
  for (const operation of operations) {
    builder.addOperation(operation);
  }
  const transaction = builder.setTimeout(60).build();
  transaction.sign(source);

  try {
    await server.submitTransaction(transaction);
  } catch (error) {
    throw new Error(
      `Stellar seeder submit failed from ${source.publicKey()}${formatUnknownError(
        error,
      )}`,
    );
  }
}

function formatUnknownError(error: unknown): string {
  if (!error) {
    return '';
  }
  if (error instanceof Error) {
    return `: ${error.message}`;
  }
  return `: ${String(error)}`;
}
