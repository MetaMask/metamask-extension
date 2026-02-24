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

function createControllerAccess(
  options: CreatePerpsInfrastructureOptions,
): PerpsControllerAccess {
  const {
    selectedAddress,
    signTypedMessage,
    findNetworkClientIdForChain,
    submitRequestToBackground,
    generateActionId,
  } = options;
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
        return '0xa4b1' as `0x${string}`;
      },
      findNetworkClientIdForChain: (chainId) =>
        findNetworkClientIdForChain(chainId),
      getSelectedNetworkClientId: () => {
        // TODO: Wire to NetworkController
        return 'mainnet';
      },
    },
    transaction: {
      submit: async (txParams, txOptions) => {
        const {
          networkClientId: rawNetworkClientId,
          origin,
          type,
          gasFeeToken,
        } = txOptions;

        const networkClientId = await Promise.resolve(rawNetworkClientId);

        if (!networkClientId) {
          throw new Error('No network client found for Perps transaction');
        }

        const addTransactionOptions = {
          networkClientId,
          origin: origin ?? 'metamask',
          actionId: generateActionId(),
          ...(type === undefined ? {} : { type }),
          ...(gasFeeToken === undefined ? {} : { gasFeeToken }),
        };

        const transactionMeta = await submitRequestToBackground<{
          id: string;
          hash?: string;
        }>('addTransaction', [txParams, addTransactionOptions]);

        return {
          result: Promise.resolve(transactionMeta.hash ?? ''),
          transactionMeta,
        };
      },
    },
    rewards: {
      getFeeDiscount: async (_caipAccountId) => {
        return 0;
      },
    },
    authentication: {
      getBearerToken: async () => {
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
