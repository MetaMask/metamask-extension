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
 * eth_accounts history). Used as a proxy for "may have local Buy orders".
 * Includes `PORTFOLIO_URL` origin so local Portfolio (e.g. localhost:3000) works.
 */
export function hasEverConnectedToPortfolio(state: unknown): boolean {
  const subjects = getPermissionSubjects(state) ?? {};
  const history = getLastConnectedInfo(state) ?? {};
  const configuredOrigin = getConfiguredPortfolioOrigin();
  const origins = configuredOrigin
    ? [...PORTFOLIO_ORIGINS, configuredOrigin]
    : [...PORTFOLIO_ORIGINS];

  return origins.some(
    (origin) => Boolean(subjects[origin]) || Boolean(history[origin]),
  );
}
