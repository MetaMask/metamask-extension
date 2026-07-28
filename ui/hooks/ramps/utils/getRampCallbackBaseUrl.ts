import { RampsEnvironment } from '@metamask/ramps-controller';
import { getRampsEnvironment } from '../../../../shared/lib/ramps/environment';

const RAMP_CALLBACK_PATH = '/regions/fake-callback';

// Production and staging serve the callback from the on-ramp-content hosts.
// There is no `on-ramp-content.dev-api` deployment, so development uses the
// ramps dev API host, which serves `/regions/fake-callback` directly.
const RAMP_CALLBACK_HOST = {
  [RampsEnvironment.Production]: 'https://on-ramp-content.api.cx.metamask.io',
  [RampsEnvironment.Staging]: 'https://on-ramp-content.uat-api.cx.metamask.io',
  [RampsEnvironment.Development]: 'https://on-ramp.dev-api.cx.metamask.io',
  [RampsEnvironment.Local]: 'http://localhost:3000',
} as const;

/**
 * Builds the redirect URL handed to providers when a quote is requested, and
 * matched against tab navigations to detect the end of a hosted checkout.
 *
 * Derived from {@link getRampsEnvironment} so the callback host can never point
 * at a different ramps environment than the one the controller talks to — the
 * backend parses this URL against the provider it created the order with.
 *
 * @returns The callback base URL for the current build's ramps environment.
 */
export function getRampCallbackBaseUrl(): string {
  return `${RAMP_CALLBACK_HOST[getRampsEnvironment()]}${RAMP_CALLBACK_PATH}`;
}
