import { TransactionMeta } from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  CachedScanAddressResponse,
  createCacheKey,
  mapChainIdToSupportedEVMChain,
  ResultType,
} from '../trust-signals';

// TODO: Replace with createProjectLogger once debug package works in UI context.
// The debug package relies on localStorage in the browser, but the extension
// popup may not initialize it correctly. Background logs via debug work fine.
const log = (...args: unknown[]) =>
  // eslint-disable-next-line no-console
  console.debug('[enforced-sim]', ...args);

const DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE = 10;

/**
 * State required by the enforced simulations trust signal check.
 */
export type EnforcedSimulationsState = {
  addressSecurityAlertResponses: Record<string, CachedScanAddressResponse>;
};

/**
 * Returns the default slippage percentage for enforced simulations.
 *
 * @returns The slippage percentage.
 */
export function getEnforcedSimulationsSlippage(): number {
  return DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE;
}

/**
 * Determines whether a transaction is eligible for enforced simulations.
 *
 * When state is provided and the chain supports trust signals, also
 * requires that at least one recipient address is loaded and not trusted.
 * If the chain is unsupported by trust signals, the transaction remains
 * eligible since we cannot verify trust. When state is omitted (e.g.
 * background hook), only the base eligibility checks are applied.
 *
 * @param transactionMeta - The transaction metadata.
 * @param state - Optional trust signal state. When provided, the trust
 * signal for the recipient must be loaded and not trusted.
 * @returns Whether the transaction is eligible for enforced simulations.
 */
export function getIsEnforcedSimulationsEligible(
  transactionMeta: TransactionMeta,
  state?: EnforcedSimulationsState,
): boolean {
  const { delegationAddress, origin, simulationData, type } = transactionMeta;

  if (!process.env.ENABLE_ENFORCED_SIMULATIONS) {
    log('Not eligible: env flag disabled');
    return false;
  }

  if (!origin || origin === ORIGIN_METAMASK) {
    log('Not eligible: origin', origin);
    return false;
  }

  if (!delegationAddress) {
    log('Not eligible: no delegationAddress');
    return false;
  }

  if (!hasBalanceChanges(simulationData)) {
    log('Not eligible: no balance changes', {
      nativeBalanceChange: simulationData?.nativeBalanceChange,
      tokenBalanceChanges: simulationData?.tokenBalanceChanges?.length,
    });
    return false;
  }

  if (state) {
    const { chainId, txParams, txParamsOriginal, nestedTransactions } =
      transactionMeta;

    const supportedChain = chainId
      ? mapChainIdToSupportedEVMChain(chainId)
      : undefined;

    log('Trust signal check', { chainId, supportedChain, type });

    // If trust signals don't support this chain, remain eligible —
    // we can't verify trust so the user should still get protection.
    if (supportedChain) {
      // Use the original `to` address before any container wrapping,
      // since containers may redirect to a trusted delegation manager.
      const originalTo = txParamsOriginal?.to ?? txParams?.to;
      const toAddresses = getToAddresses(originalTo, nestedTransactions);

      log('To addresses', { originalTo, toAddresses });

      if (toAddresses.length === 0) {
        log('Not eligible: no to addresses');
        return false;
      }

      const hasUntrustedAddress = toAddresses.some((address) => {
        const cacheKey = createCacheKey(supportedChain, address);
        const cached = state.addressSecurityAlertResponses[cacheKey];

        log('Trust signal', { address, cacheKey, cached });

        if (!cached || cached.result_type === ResultType.Loading) {
          return false;
        }

        return cached.result_type !== ResultType.Trusted;
      });

      if (!hasUntrustedAddress) {
        log('Not eligible: no untrusted address found');
        return false;
      }
    }
  }

  log('Eligible');
  return true;
}

function getToAddresses(
  primaryTo: string | undefined,
  nestedTransactions: TransactionMeta['nestedTransactions'],
): string[] {
  const addresses: string[] = [];

  if (primaryTo) {
    addresses.push(primaryTo);
  }

  if (nestedTransactions) {
    for (const nested of nestedTransactions) {
      if (nested.to) {
        addresses.push(nested.to);
      }
    }
  }

  return addresses;
}

function hasBalanceChanges(
  simulationData?: TransactionMeta['simulationData'],
): boolean {
  return (
    Boolean(simulationData?.nativeBalanceChange) ||
    Boolean(simulationData?.tokenBalanceChanges?.length)
  );
}
