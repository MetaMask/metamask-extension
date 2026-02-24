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
  PerpsAnalyticsEvent,
  PerpsAnalyticsProperties,
  PerpsTraceName,
  PerpsTraceValue,
  PerpsRemoteFeatureFlagState,
  MarketDataFormatters,
  PerpsCacheInvalidator,
  VersionGatedFeatureFlag,
} from '@metamask/perps-controller';

type SubmitRequestToBackground = <Result>(
  method: string,
  args?: unknown[],
) => Promise<Result>;

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
  /** Synchronous resolver for mapping chain ID to network client ID */
  findNetworkClientIdForChain: (chainId: string) => string | undefined;
  /** Function to submit RPC-style requests to the background process */
  submitRequestToBackground: SubmitRequestToBackground;
  /** Function to create a unique action id for background actions */
  generateActionId: () => number;
  /**
   * Read remote feature flag state from Redux.
   * Returns the current state; null means store not yet available.
   */
  getRemoteFeatureFlagState: () => PerpsRemoteFeatureFlagState | null;
  /**
   * Subscribe to Redux store changes for remote feature flag state.
   * Returns an unsubscribe function.
   */
  subscribeToRemoteFeatureFlagChanges: (
    handler: (state: PerpsRemoteFeatureFlagState) => void,
  ) => () => void;
};

function createLogger(): PerpsLogger {
  return {
    error: (error, options) => {
      console.error('[Perps Error]', error, options);
    },
  };
}

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

function createMetrics(): PerpsMetrics {
  return {
    isEnabled: () => false,
    trackPerpsEvent: (
      _event: PerpsAnalyticsEvent,
      _properties: PerpsAnalyticsProperties,
    ) => {
      // TODO: Integrate with MetaMetrics when ready
    },
  };
}

function createPerformance(): PerpsPerformance {
  return {
    now: () => performance.now(),
  };
}

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

function createStreamManager(): PerpsStreamManager {
  return {
    pauseChannel: (_channel: string) => {
      // No-op for PoC
    },
    resumeChannel: (_channel: string) => {
      // No-op for PoC
    },
    clearAllChannels: () => {
      // No-op for PoC
    },
  };
}

function createFeatureFlags(): PerpsPlatformDependencies['featureFlags'] {
  return {
    validateVersionGated: (_flag: VersionGatedFeatureFlag) => {
      // Extension PoC: always allow version-gated features
      return true;
    },
  };
}

function createMarketDataFormatters(): MarketDataFormatters {
  const formatCompact = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    }
    if (abs >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    if (abs >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return {
    formatVolume: formatCompact,
    formatPerpsFiat: (value: number) => {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    formatPercentage: (percent: number) => {
      return `${percent >= 0 ? '' : ''}${percent.toFixed(2)}%`;
    },
    priceRangesUniversal: [],
  };
}

function createCacheInvalidator(): PerpsCacheInvalidator {
  return {
    invalidate: () => {
      // No-op for PoC
    },
    invalidateAll: () => {
      // No-op for PoC
    },
  };
}

function createControllers(
  options: CreatePerpsInfrastructureOptions,
): PerpsPlatformDependencies['controllers'] {
  const {
    selectedAddress,
    signTypedMessage,
    findNetworkClientIdForChain,
    submitRequestToBackground: submitRequest,
    generateActionId,
    getRemoteFeatureFlagState,
    subscribeToRemoteFeatureFlagChanges,
  } = options;

  const defaultFeatureFlagState: PerpsRemoteFeatureFlagState = {
    remoteFeatureFlags: {},
  };

  return {
    network: {
      getState: () => ({
        selectedNetworkClientId: 'mainnet',
      }),
      getNetworkClientById: (_id: string) => ({
        configuration: { chainId: '0xa4b1' },
      }),
      findNetworkClientIdByChainId: (chainId: `0x${string}`) =>
        findNetworkClientIdForChain(chainId),
    },
    keyring: {
      getState: () => ({ isUnlocked: true }),
      signTypedMessage: async (msgParams, version) => {
        return signTypedMessage(msgParams, version);
      },
    },
    transaction: {
      addTransaction: async (txParams, opts) => {
        const { networkClientId, origin, type } = opts;

        if (!networkClientId) {
          throw new Error('No network client found for Perps transaction');
        }

        const addTransactionOptions = {
          networkClientId,
          origin: origin ?? 'metamask',
          actionId: generateActionId(),
          ...(type === undefined ? {} : { type }),
        };

        const transactionMeta = await submitRequest<{
          id: string;
          hash?: string;
        }>('addTransaction', [txParams, addTransactionOptions]);

        return {
          result: Promise.resolve(transactionMeta.hash ?? ''),
          transactionMeta,
        };
      },
    },
    remoteFeatureFlags: {
      getState: () => getRemoteFeatureFlagState() ?? defaultFeatureFlagState,
      onStateChange: (handler: (state: PerpsRemoteFeatureFlagState) => void) =>
        subscribeToRemoteFeatureFlagChanges(handler),
    },
    accountTree: {
      getAccountsFromSelectedGroup: () => [
        { address: selectedAddress, type: 'eip155:eoa', id: selectedAddress },
      ],
      onSelectedAccountGroupChange: () => {
        // No-op for PoC; returns unsubscribe stub
        return () => undefined;
      },
    },
    authentication: {
      getBearerToken: async () => '',
    },
    rewards: {
      getPerpsDiscountForAccount: async () => 0,
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
    featureFlags: createFeatureFlags(),
    marketDataFormatters: createMarketDataFormatters(),
    cacheInvalidator: createCacheInvalidator(),
    controllers: createControllers(options),
  };
}
