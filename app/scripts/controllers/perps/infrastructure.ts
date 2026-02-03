/**
 * Platform Infrastructure for PerpsController (Extension PoC)
 *
 * This module provides the PerpsPlatformDependencies required by
 * the real @metamask/perps-controller package.
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
 * Create a stubbed logger for error reporting.
 * In production, this should integrate with Sentry.
 */
function createLogger(): PerpsLogger {
  return {
    error: (error, options) => {
      console.error('[Perps Error]', error, options);
      // TODO: Integrate with Sentry when ready
      // captureException(error, { tags: options?.tags, extra: options?.extras });
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
      // trackEvent({ event: _event, properties: _properties });
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
      // Sentry.startSpan({ name: params.name, op: params.op, data: params.data });
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
 * For the PoC, we hardcode the address to demonstrate balance fetching.
 */
function createControllerAccess(): PerpsControllerAccess {
  return {
    accounts: {
      getSelectedEvmAccount: () => {
        // Hardcoded for PoC - wire to AccountsController in production
        return { address: '0x316BDE155acd07609872a56Bc32CcfB0B13201fA' };
      },
      formatAccountToCaipId: (address: string, chainId: string) => {
        return `eip155:${chainId}:${address}`;
      },
    },
    keyring: {
      signTypedMessage: async (_msgParams, _version) => {
        // TODO: Wire to KeyringController for trading operations
        throw new Error('Keyring signing not implemented in PoC');
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
      submit: async (_txParams, _options) => {
        // TODO: Wire to TransactionController for deposit/withdraw
        throw new Error('Transaction submission not implemented in PoC');
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
 * @returns PerpsPlatformDependencies object ready for PerpsController
 *
 * @example
 * ```typescript
 * import { PerpsController } from '@metamask/perps-controller';
 * import { createPerpsInfrastructure } from './infrastructure';
 *
 * const infrastructure = createPerpsInfrastructure();
 * const controller = new PerpsController({
 *   messenger,
 *   infrastructure,
 * });
 * ```
 */
export function createPerpsInfrastructure(): PerpsPlatformDependencies {
  return {
    logger: createLogger(),
    debugLogger: createDebugLogger(),
    metrics: createMetrics(),
    performance: createPerformance(),
    tracer: createTracer(),
    streamManager: createStreamManager(),
    controllers: createControllerAccess(),
  };
}
