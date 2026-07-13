import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { WALLET_PASSWORD } from '../../constants';

export { QR_SYNC_E2E_OTP } from '../../../../app/scripts/controllers/qr-sync/e2e/constants';
export { QR_SYNC_TIMEOUT_MS as QR_SYNC_E2E_TIMEOUT_MS } from '../../../../shared/constants/qr-sync';

/** Standard E2E wallet password for QrSync tests (default fixture). */
export const QR_SYNC_E2E_PASSWORD = WALLET_PASSWORD;

/**
 * Builds the default logged-in fixture used by QrSync E2E (single HD wallet).
 *
 * @returns Persisted fixture state for `withFixtures`.
 */
export function buildQrSyncFixtures() {
  return new FixtureBuilderV2().build();
}
