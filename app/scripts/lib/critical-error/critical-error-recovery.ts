import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import { CRITICAL_ERROR_SCREEN_VIEWED } from '../../../../shared/constants/start-up-errors';
import {
  CriticalErrorRepairAction,
  CriticalErrorType,
  isStateCorruptionErrorType,
  METHOD_REPAIR_DATABASE,
} from '../../../../shared/constants/state-corruption';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { captureException } from '../../../../shared/lib/sentry';
import { trackVaultCorruptionEvent } from '../state-corruption/track-vault-corruption';
import { trackCriticalErrorEvent } from './track-critical-error';

type Message = Parameters<chrome.runtime.Port['postMessage']>[0];
type RepairCallback = (
  repairAction: CriticalErrorRepairAction,
) => Promise<boolean>;

export type RegisterPortForCriticalErrorConfig = {
  port: chrome.runtime.Port;
  repairCallback: RepairCallback;
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
 * Per-port handler for critical error messages from the UI.
 * Listens for METHOD_REPAIR_DATABASE and CRITICAL_ERROR_SCREEN_VIEWED.
 * Same listener instances are added to every port. On disconnect, the handler
 * calls removeListenersForPort;
 * the caller may also call removeListenersForPort(port) when the UI signals
 * readiness (e.g. on startSendingPatches), which removes message and disconnect
 * listeners.
 */
export class CriticalErrorHandler {
  /**
   * Ports that have critical-error listeners attached. Used to reload all UI
   * windows after a repair. Ports are removed when listeners are removed or
   * the port disconnects.
   */
  connectedPorts = new Set<chrome.runtime.Port>();

  #repairCallback: RepairCallback | null = null;

  #portDisconnectHandlers = new WeakMap<chrome.runtime.Port, () => void>();

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
    const disconnectHandler = (): void => {
      this.removeListenersForPort(port);
    };
    this.#portDisconnectHandlers.set(port, disconnectHandler);
    port.onDisconnect.addListener(disconnectHandler);
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
    const disconnectHandler = this.#portDisconnectHandlers.get(port);
    if (disconnectHandler) {
      port.onDisconnect.removeListener(disconnectHandler);
      this.#portDisconnectHandlers.delete(port);
    }
    this.connectedPorts.delete(port);
  }

  /**
   * Handles a message from the UI to restore/reset after a critical error.
   *
   * @param message
   */
  async #restoreVaultListener(message: Message): Promise<void> {
    if (message?.data?.method !== METHOD_REPAIR_DATABASE) {
      return;
    }
    const params = message?.data?.params ?? {};
    const repairAction = Object.values(CriticalErrorRepairAction).includes(
      params.repairAction as CriticalErrorRepairAction,
    )
      ? (params.repairAction as CriticalErrorRepairAction)
      : CriticalErrorRepairAction.None;
    if (
      !this.#repairCallback ||
      repairAction === CriticalErrorRepairAction.None ||
      (repairAction === CriticalErrorRepairAction.Recover && !params.backup)
    ) {
      return;
    }

    // only allow the restore process once, unregister
    // listeners from all UI windows
    for (const connectedPort of this.connectedPorts) {
      this.removeListenersForPort(connectedPort);
    }

    const backup = params.backup as Backup | null;
    const criticalErrorType = getCriticalErrorType(params);

    try {
      if (isStateCorruptionErrorType(criticalErrorType)) {
        // Legacy transition event. We keep sending it for backward compatibility
        // until it is fully replaced by trackCriticalErrorEvent, which carries
        // the same information.
        trackVaultCorruptionEvent(
          backup,
          MetaMetricsEventName.VaultCorruptionRestoreWalletButtonPressed,
          criticalErrorType,
        );
      }

      // Track that the user clicked the repair button.
      trackCriticalErrorEvent(
        backup,
        MetaMetricsEventName.CriticalErrorRestoreWalletButtonPressed,
        criticalErrorType,
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          repair_action: repairAction,
        },
      );

      await this.#repairCallback(repairAction);
    } catch (repairError) {
      captureException(repairError);
    }
  }

  async #handleScreenViewedMessageListener(message: Message): Promise<void> {
    if (message?.data?.method !== CRITICAL_ERROR_SCREEN_VIEWED) {
      return;
    }
    const params = message?.data?.params ?? {};
    const repairAction = Object.values(CriticalErrorRepairAction).includes(
      params.repairAction as CriticalErrorRepairAction,
    )
      ? (params.repairAction as CriticalErrorRepairAction)
      : CriticalErrorRepairAction.None;
    const backup = params.backup as Backup | null;
    const criticalErrorType = getCriticalErrorType(params);

    if (isStateCorruptionErrorType(criticalErrorType)) {
      // Legacy transition event. We keep sending it for backward compatibility
      // until it is fully replaced by trackCriticalErrorEvent, which carries
      // the same information.
      trackVaultCorruptionEvent(
        backup,
        MetaMetricsEventName.VaultCorruptionRestoreWalletScreenViewed,
        criticalErrorType,
      );
    }

    // Track that the user viewed the critical error screen.
    trackCriticalErrorEvent(
      backup,
      MetaMetricsEventName.CriticalErrorScreenViewed,
      criticalErrorType,
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        repair_action: repairAction,
      },
    );
  }
}
