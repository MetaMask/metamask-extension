/**
 * Platform Infrastructure for PerpsController (Extension PoC)
 *
 * This module provides the PerpsPlatformDependencies required by
 * the real @metamask/perps-controller package.
 *
 * Note: This file lives in app/scripts/controllers/ but currently runs in the
 * UI process (the PerpsController is instantiated in the UI via getPerpsController.ts).
 * It's kept here intentionally so it's co-located with the controller re-exports and
 * will already be in the right place when the controller moves to the background.
 * All UI-specific dependencies (e.g. signTypedMessage) are injected via the options
 * parameter to avoid cross-layer imports.
 *
 * For the PoC, most dependencies are stubbed. As integration matures,
 * these should be wired up to real extension services.
 */

import type {
  PerpsPlatformDependencies,
  PerpsLogger,
  PerpsDebugLogger,
  PerpsMetrics,
  PerpsPerformance,
  PerpsTracer,
  PerpsStreamManager,
  PerpsControllerAccess,
  PerpsAnalyticsEvent,
  PerpsAnalyticsProperties,
  PerpsTraceName,
  PerpsTraceValue,
} from '@metamask/perps-controller';

/**
 * Options for creating perps infrastructure.
 */
export type CreatePerpsInfrastructureOptions = {
  /** The currently selected account address */
  selectedAddress: string;
  /** Function to sign EIP-712 typed data via KeyringController */
  signTypedMessage: (
    msgParams: { from: string; data: unknown },
    version: unknown,
  ) => Promise<string>;
};

/**
 * Create a stubbed logger for error reporting.
 * In production, this should integrate with Sentry.
 */
function createLogger(): PerpsLogger {
  return {
    error: (error, options) => {
      console.error('[Perps Error]', error, options);
      // TODO: Integrate with Sentry when ready
    },
  };
}

/**
 * Create a debug logger for development.
 * Only logs in development mode.
 */
function createDebugLogger(): PerpsDebugLogger {
  const isDevelopment = process.env.METAMASK_DEBUG === 'true';
  return {
    log: (...args: unknown[]) => {
      if (isDevelopment) {
        console.log('[Perps]', ...args);
      }
    },
  };
}

/**
 * Create a stubbed metrics tracker.
 * In production, this should integrate with MetaMetrics.
 */
function createMetrics(): PerpsMetrics {
  return {
    isEnabled: () => false, // Disable metrics for PoC
    trackPerpsEvent: (
      _event: PerpsAnalyticsEvent,
      _properties: PerpsAnalyticsProperties,
    ) => {
      // TODO: Integrate with MetaMetrics when ready
    },
  };
}

/**
 * Create a performance monitor using the browser Performance API.
 */
function createPerformance(): PerpsPerformance {
  return {
    now: () => performance.now(),
  };
}

/**
 * Create a stubbed tracer for Sentry/observability.
 * In production, this should create real Sentry spans.
 */
function createTracer(): PerpsTracer {
  return {
    trace: (_params: {
      name: PerpsTraceName;
      id: string;
      op: string;
      tags?: Record<string, PerpsTraceValue>;
      data?: Record<string, PerpsTraceValue>;
    }) => {
      // TODO: Integrate with Sentry tracing when ready
    },
    endTrace: (_params: {
      name: PerpsTraceName;
      id: string;
      data?: Record<string, PerpsTraceValue>;
    }) => {
      // TODO: End Sentry span
    },
    setMeasurement: (_name: string, _value: number, _unit: string) => {
      // TODO: Set Sentry measurement
    },
  };
}

/**
 * Create a stubbed stream manager.
 * The extension doesn't need stream pausing for the PoC.
 */
function createStreamManager(): PerpsStreamManager {
  return {
    pauseChannel: (_channel: string) => {
      // No-op for PoC - stream pausing not needed in extension
    },
    resumeChannel: (_channel: string) => {
      // No-op for PoC
    },
    clearAllChannels: () => {
      // No-op for PoC
    },
  };
}

/**
 * Create stubbed controller access.
 * These should be wired to real extension controllers for trading operations.
 *
 * @param options - Configuration options
 * @param options.selectedAddress - The currently selected account address
 * @param options.signTypedMessage - Function to sign EIP-712 typed data
 */
function createControllerAccess(
  options: CreatePerpsInfrastructureOptions,
): PerpsControllerAccess {
  const { selectedAddress, signTypedMessage } = options;
  return {
    accounts: {
      getSelectedEvmAccount: () => {
        return { address: selectedAddress };
      },
      formatAccountToCaipId: (address: string, chainId: string) => {
        return `eip155:${chainId}:${address}`;
      },
    },
    keyring: {
      signTypedMessage: async (msgParams, version) => {
        const signature = await signTypedMessage(msgParams, version);
        return signature;
      },
    },
    network: {
      getChainIdForNetwork: (_networkClientId: string) => {
        // TODO: Wire to NetworkController
        // Return Arbitrum mainnet as default for Hyperliquid
        return '0xa4b1' as `0x${string}`;
      },
      findNetworkClientIdForChain: (_chainId) => {
        // TODO: Wire to NetworkController
        return undefined;
      },
      getSelectedNetworkClientId: () => {
        // TODO: Wire to NetworkController
        return 'mainnet';
      },
    },
    transaction: {
      submit: async (txParams, options) => {
        const transactionMeta = await submitRequestToBackground<{
          id: string;
          hash?: string;
        }>('addTransactionAndWaitForPublish', [
          txParams,
          {
            ...options,
            origin: options.origin ?? 'metamask',
          },
        ]);

        return {
          // Align with mobile flow by resolving only after publish/hash is available.
          result: Promise.resolve(transactionMeta.hash ?? ''),
          transactionMeta,
        };
      },
    },
    rewards: {
      getFeeDiscount: async (_caipAccountId) => {
        // No fee discount for PoC
        return 0;
      },
    },
    authentication: {
      getBearerToken: async () => {
        // No authentication for PoC
        return '';
      },
    },
  };
}

/**
 * Create the complete PerpsPlatformDependencies for the extension.
 *
 * @param options - Configuration options
 * @param options.selectedAddress - The currently selected account address
 * @param options.signTypedMessage - Function to sign EIP-712 typed data via background
 * @returns PerpsPlatformDependencies object ready for PerpsController
 */
export function createPerpsInfrastructure(
  options: CreatePerpsInfrastructureOptions,
): PerpsPlatformDependencies {
  return {
    logger: createLogger(),
    debugLogger: createDebugLogger(),
    metrics: createMetrics(),
    performance: createPerformance(),
    tracer: createTracer(),
    streamManager: createStreamManager(),
    controllers: createControllerAccess(options),
  };
}
