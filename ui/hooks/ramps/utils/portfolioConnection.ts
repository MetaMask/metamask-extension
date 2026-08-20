import {
  getLastConnectedInfo,
  getPermittedAccountsByOrigin,
} from '../../../selectors';

export const PORTFOLIO_ORIGINS = [
  'https://app.metamask.io',
  'https://portfolio.metamask.io',
] as const;

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
 * permission or eth_accounts history). Used to send returning Portfolio buyers
 * back to Portfolio while in-app Buy rolls out — never-connected wallets use
 * in-app. Includes `PORTFOLIO_URL` origin so local Portfolio (e.g.
 * localhost:3000) works.
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
