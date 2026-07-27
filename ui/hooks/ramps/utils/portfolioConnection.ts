import {
  getLastConnectedInfo,
  getPermissionSubjects,
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
 * Whether this wallet has ever connected to Portfolio (active permission or
 * eth_accounts history). Used to send returning Portfolio buyers back to
 * Portfolio while in-app Buy rolls out — never-connected wallets use in-app.
 * Includes `PORTFOLIO_URL` origin so local Portfolio (e.g. localhost:3000) works.
 *
 * @param state - Redux root state (or metamask slice wrapper used by selectors).
 * @returns True when any known Portfolio origin appears in subjects or history.
 */
export function hasEverConnectedToPortfolio(
  state: Record<string, unknown>,
): boolean {
  const subjects = (getPermissionSubjects(state) ?? {}) as Record<
    string,
    unknown
  >;
  const history = (getLastConnectedInfo(state) ?? {}) as Record<
    string,
    unknown
  >;
  const configuredOrigin = getConfiguredPortfolioOrigin();
  const origins = configuredOrigin
    ? [...PORTFOLIO_ORIGINS, configuredOrigin]
    : [...PORTFOLIO_ORIGINS];

  return origins.some(
    (origin) => Boolean(subjects[origin]) || Boolean(history[origin]),
  );
}
