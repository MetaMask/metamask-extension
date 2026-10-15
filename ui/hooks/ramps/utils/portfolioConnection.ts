import {
  getLastConnectedInfo,
  getPermittedAccountsByOrigin,
} from '../../../selectors';
import {
  getStorageItem,
  setStorageItem,
} from '../../../../shared/lib/storage-helpers';

export const PORTFOLIO_ORIGINS = [
  'https://app.metamask.io',
  'https://portfolio.metamask.io',
] as const;

export const PORTFOLIO_BUY_MIGRATION_ATTEMPTED_STORAGE_KEY =
  'portfolio-buy-migration-attempted-v13';

/**
 * Whether this extension installation has already sent the user to Portfolio
 * to give its app-shell migration a chance to upload local Buy orders.
 *
 * @returns True after the first migration visit was initiated.
 */
export async function hasAttemptedPortfolioBuyMigration(): Promise<boolean> {
  const value = await getStorageItem(
    PORTFOLIO_BUY_MIGRATION_ATTEMPTED_STORAGE_KEY,
  );
  return value === true || value === '1';
}

/**
 * Records the migration attempt before Portfolio is opened. Portfolio does not
 * write its cloud migration marker when it has no local Buy orders, so this
 * local marker prevents repeated redirects for users with empty history.
 */
export async function markPortfolioBuyMigrationAttempted(): Promise<void> {
  await setStorageItem(PORTFOLIO_BUY_MIGRATION_ATTEMPTED_STORAGE_KEY, true);
}

function getConfiguredPortfolioOrigin(): string | null {
  const configured = process.env.PORTFOLIO_URL;
  if (!configured) {
    return null;
  }
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

/**
 * Whether this wallet has ever connected accounts to Portfolio (live accounts
 * permission or eth_accounts history). Used to offer returning Portfolio users
 * one migration visit before keeping them in the native Buy flow. Includes
 * `PORTFOLIO_URL` origin so local Portfolio (e.g. localhost:3000) works.
 *
 * Portfolio origins are present in `subjects` on a fresh install because
 * preinstalled snaps pre-approve them via `initialConnections`, so a subject
 * entry alone is not evidence of a connection — only permitted accounts are.
 *
 * @param state - Redux root state (or metamask slice wrapper used by selectors).
 * @returns True when any known Portfolio origin has permitted accounts or history.
 */
export function hasEverConnectedToPortfolio(
  state: Record<string, unknown>,
): boolean {
  const permittedAccountsByOrigin = (getPermittedAccountsByOrigin(state) ??
    {}) as Record<string, string[]>;
  const history = (getLastConnectedInfo(state) ?? {}) as Record<
    string,
    unknown
  >;
  const configuredOrigin = getConfiguredPortfolioOrigin();
  const origins = configuredOrigin
    ? [...PORTFOLIO_ORIGINS, configuredOrigin]
    : [...PORTFOLIO_ORIGINS];

  return origins.some(
    (origin) =>
      Boolean(permittedAccountsByOrigin[origin]) || Boolean(history[origin]),
  );
}
