import type { Backup } from '../../../../shared/lib/backup';
import { CRITICAL_ERROR_SCREEN_VIEWED } from '../../../../shared/constants/start-up-errors';
import {
  CriticalErrorType,
  METHOD_REPAIR_DATABASE_TIMEOUT,
} from '../../../../shared/constants/state-corruption';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { captureException } from '../../../../shared/lib/sentry';
import { runRepairAndReloadPorts } from '../repair';
import { trackCriticalErrorEvent } from './track-critical-error';

type Message = Parameters<chrome.runtime.Port['postMessage']>[0];

export type RegisterPortForCriticalErrorConfig = {
  port: chrome.runtime.Port;
  repairCallback: (backup: Backup | null) => Promise<void>;
};

/**
 * Determines the critical error type from message params.
 * @param params
 */
function getCriticalErrorType(
  params: Record<string, unknown>,
): CriticalErrorType {
  const { criticalErrorType } = params;
  return Object.values(CriticalErrorType).includes(
    criticalErrorType as CriticalErrorType,
  )
    ? (criticalErrorType as CriticalErrorType)
    : CriticalErrorType.Other;
}

/**
 * Per-port handler for critical error messages from the UI (timeout/init flow).
 * Listens for METHOD_REPAIR_DATABASE_TIMEOUT and CRITICAL_ERROR_SCREEN_VIEWED.
 * Same listener instances are added to every port (like state-corruption's
 * restoreVaultListener). Listeners are removed on port disconnect automatically;
 * the caller should also call removeListenersForPort(port) when the UI signals
 * readiness (e.g. on startSendingPatches).
 */
export class CriticalErrorHandler {
  /**
   * Ports that have critical-error listeners attached. Used to reload all UI
   * windows after a repair. Ports are removed when listeners are removed or
   * the port disconnects.
   */
  connectedPorts = new Set<chrome.runtime.Port>();

  #repairCallback: ((backup: Backup | null) => Promise<void>) | null = null;

  #restoreListener = (message: Message): void => {
    this.#restoreVaultListener(message);
  };

  #handleMessageListener = (message: Message): void => {
    this.#handleScreenViewedMessageListener(message);
  };

  /**
   * Registers the port for critical-error handling: adds it to connectedPorts,
   * attaches the same shared listeners used for all ports (so we can
   * unregister from all UI windows in one go when one triggers repair), and
   * removes listeners when the port disconnects.
   *
   * @param config - Configuration for this port (port, repairCallback).
   * @param config.port
   * @param config.repairCallback
   */
  registerPortForCriticalError({
    port,
    repairCallback,
  }: RegisterPortForCriticalErrorConfig): void {
    this.#repairCallback = repairCallback;

    this.connectedPorts.add(port);
    port.onMessage.addListener(this.#restoreListener);
    port.onMessage.addListener(this.#handleMessageListener);
    port.onDisconnect.addListener(() => {
      this.removeListenersForPort(port);
    });
  }

  /**
   * Removes critical-error listeners for the port and removes the port from
   * connectedPorts. Idempotent; safe to call on disconnect or when the UI
   * signals readiness (e.g. startSendingPatches).
   *
   * @param port - The port to detach.
   */
  removeListenersForPort(port: chrome.runtime.Port): void {
    port.onMessage.removeListener(this.#restoreListener);
    port.onMessage.removeListener(this.#handleMessageListener);
    this.connectedPorts.delete(port);
  }

  /**
   * Handles a message from the UI to restore from backup (same role as
   * state-corruption's restoreVaultListener). Unregisters from all ports,
   * runs repairCallback, then sends RELOAD_WINDOW to all.
   * @param message
   */
  async #restoreVaultListener(message: Message): Promise<void> {
    if (message?.data?.method !== METHOD_REPAIR_DATABASE_TIMEOUT) {
      return;
    }
    const params = message?.data?.params ?? {};
    if (!this.#repairCallback || !params.backup) {
      return;
    }

    // only allow the restore process once, unregister
    // listeners from all UI windows
    this.connectedPorts.forEach((connectedPort) => {
      connectedPort.onMessage.removeListener(this.#restoreListener);
      connectedPort.onMessage.removeListener(this.#handleMessageListener);
    });

    const criticalErrorType = getCriticalErrorType(params);
    const repairCallback = this.#repairCallback;

    try {
      // Track that the user clicked the restore button.
      trackCriticalErrorEvent(
        params.backup as Backup | null,
        MetaMetricsEventName.CriticalErrorRestoreWalletButtonPressed,
        criticalErrorType,
      );

      await runRepairAndReloadPorts(
        params.backup as Backup | null,
        repairCallback,
        this.connectedPorts,
      );
    } catch (repairError) {
      captureException(repairError);
    }
  }

  async #handleScreenViewedMessageListener(message: Message): Promise<void> {
    if (message?.data?.method !== CRITICAL_ERROR_SCREEN_VIEWED) {
      return;
    }
    const params = message?.data?.params ?? {};
    if (!params.backup) {
      return;
    }

    const canTriggerRestore = Boolean(params.canTriggerRestore);
    const criticalErrorType = getCriticalErrorType(params);

    // Track that the user viewed the critical error screen.
    trackCriticalErrorEvent(
      params.backup as Backup | null,
      MetaMetricsEventName.CriticalErrorScreenViewed,
      criticalErrorType,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment property
      { restore_accounts_enabled: canTriggerRestore },
    );
  }
}
