import { getServerMochaToBackground } from '../../background-socket/server-mocha-to-background';
import type {
  QrSyncSimulatorAction,
  SimulatorParams,
} from '../../../../app/scripts/controllers/qr-sync/e2e/types';

/**
 * Sends a mobile-wallet simulation step to the extension background (test builds).
 *
 * @param action - The simulator action to run.
 * @param params - Optional action parameters.
 */
export function qrSyncSimulate(
  action: QrSyncSimulatorAction,
  params?: SimulatorParams,
): void {
  const mock = getServerMochaToBackground();
  console.log('Mock', mock);
  mock.send({
    command: 'qrSyncSimulate',
    action,
    params,
  });
  console.log('QrSyncSimulate', action, params);
}
