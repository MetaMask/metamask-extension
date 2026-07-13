import log from 'loglevel';
import type { MobileWalletSimulator } from './mobile-wallet-simulator';
import type { QrSyncSimulatorAction, SimulatorParams } from './types';

let simulatorInstance: MobileWalletSimulator | null = null;

/**
 * Registers the mobile simulator instance for background-socket commands.
 *
 * @param simulator - The simulator bound to the active mock MWP client.
 */
export function registerQrSyncE2eBridge(
  simulator: MobileWalletSimulator,
): void {
  simulatorInstance = simulator;
}

/**
 * Handles `qrSyncSimulate` commands from the E2E test runner.
 *
 * @param message - The background-socket message payload.
 * @param message.action
 * @param message.params
 */
export function handleQrSyncSimulateMessage(message: {
  action?: QrSyncSimulatorAction;
  params?: SimulatorParams;
}): void {
  if (!simulatorInstance) {
    log.warn('QrSync E2E bridge: simulator not registered');
    return;
  }

  if (!message.action) {
    log.warn('QrSync E2E bridge: missing action');
    return;
  }

  simulatorInstance.runAction(message.action, message.params);
}
