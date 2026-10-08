import { Messenger } from '@metamask/messenger';
import {
  createExactExecutionBatchTerms,
  createExactExecutionTerms,
  createLimitedCallsTerms,
  createRedeemerTerms,
  createTimestampTerms,
} from '@metamask/delegation-core';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Caveat,
  DeleGatorEnvironment,
  ExecutionStruct,
} from '../../../../shared/lib/delegation';
import { getSubsidizedCaveats } from './subsidized-caveats';

export const CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME =
  'confirmations_delegations' as const;

const DEFAULT_DEADLINE_SECONDS = 30 * 60;

type DelegationCaveatsMessenger = Messenger<
  string,
  RemoteFeatureFlagControllerGetStateAction,
  never
>;

type ConfirmationsDelegationsFeatureFlag = {
  deadlineSeconds?: number;
};

export type GetDelegationCaveatsRequest = {
  /** Caveats to use as is, skipping all generated caveats. */
  caveats?: Caveat[];

  /** Delegate address, also allowed to redeem if redeemers are provided. */
  delegatee?: Hex;

  /** DeleGator environment with caveat enforcer addresses. */
  environment: DeleGatorEnvironment;

  /** Executions the delegation will be redeemed with. */
  executions: ExecutionStruct[];

  /** Whether to build subsidized caveats instead of exact execution caveats. */
  isSubsidized?: boolean;

  /** Messenger used to read remote feature flags. */
  messenger: DelegationCaveatsMessenger;

  /** Addresses allowed to redeem the delegation. */
  redeemers?: Hex[];

  /** Transaction being delegated. */
  transaction: TransactionMeta;
};

/**
 * Builds the caveats for an EIP-7702 delegation.
 *
 * Provided caveats are returned unchanged. Otherwise the base caveats
 * (single call, deadline and optional redeemers) are combined with either the
 * subsidized caveats or an exact execution caveat.
 *
 * @param request - Request options.
 * @returns The delegation caveats.
 */
export function getDelegationCaveats(
  request: GetDelegationCaveatsRequest,
): Caveat[] {
  const { caveats, environment, executions, isSubsidized, transaction } =
    request;

  if (caveats) {
    return caveats;
  }

  const baseCaveats = getBaseCaveats(request);

  if (isSubsidized) {
    return [...baseCaveats, ...getSubsidizedCaveats(environment, transaction)];
  }

  return [...baseCaveats, getExactExecutionCaveat(environment, executions)];
}

function getBaseCaveats({
  delegatee,
  environment,
  messenger,
  redeemers,
}: GetDelegationCaveatsRequest): Caveat[] {
  const limitedCallsCaveat: Caveat = {
    args: '0x',
    enforcer: environment.caveatEnforcers.LimitedCallsEnforcer,
    terms: createLimitedCallsTerms({ limit: 1 }),
  };

  const deadlineCaveat: Caveat = {
    args: '0x',
    enforcer: environment.caveatEnforcers.TimestampEnforcer,
    terms: createTimestampTerms({
      afterThreshold: 0,
      beforeThreshold: getDeadline(messenger),
    }),
  };

  const caveats = [limitedCallsCaveat, deadlineCaveat];

  if (!redeemers?.length) {
    return caveats;
  }

  return [...caveats, getRedeemerCaveat(environment, redeemers, delegatee)];
}

function getExactExecutionCaveat(
  environment: DeleGatorEnvironment,
  executions: ExecutionStruct[],
): Caveat {
  if (executions.length > 1) {
    return {
      args: '0x',
      enforcer: environment.caveatEnforcers.ExactExecutionBatchEnforcer,
      terms: createExactExecutionBatchTerms({ executions }),
    };
  }

  return {
    args: '0x',
    enforcer: environment.caveatEnforcers.ExactExecutionEnforcer,
    terms: createExactExecutionTerms({ execution: executions[0] }),
  };
}

/**
 * Builds a RedeemerEnforcer caveat so only the given addresses (and the
 * delegatee, if set) can submit the `redeemDelegations` call.
 *
 * @param environment - DeleGator environment with caveat enforcer addresses.
 * @param redeemers - Addresses allowed to redeem the delegation.
 * @param delegatee - Optional delegate address, also allowed to redeem.
 * @returns The RedeemerEnforcer caveat.
 */
function getRedeemerCaveat(
  environment: DeleGatorEnvironment,
  redeemers: Hex[],
  delegatee: Hex | undefined,
): Caveat {
  const allowedRedeemers = [
    ...new Set(
      [...redeemers, ...(delegatee ? [delegatee] : [])].map(
        (address) => address.toLowerCase() as Hex,
      ),
    ),
  ];

  return {
    args: '0x',
    enforcer: environment.caveatEnforcers.RedeemerEnforcer,
    terms: createRedeemerTerms({ redeemers: allowedRedeemers }),
  };
}

function getDeadline(messenger: DelegationCaveatsMessenger): number {
  const nowSeconds = Math.floor(Date.now() / 1000);

  return nowSeconds + getDeadlineSeconds(messenger);
}

function getDeadlineSeconds(messenger: DelegationCaveatsMessenger): number {
  const { remoteFeatureFlags } = messenger.call(
    'RemoteFeatureFlagController:getState',
  );

  const { deadlineSeconds } =
    (remoteFeatureFlags?.[CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME] as
      | ConfirmationsDelegationsFeatureFlag
      | undefined) ?? {};

  if (
    typeof deadlineSeconds !== 'number' ||
    !Number.isFinite(deadlineSeconds) ||
    deadlineSeconds <= 0
  ) {
    return DEFAULT_DEADLINE_SECONDS;
  }

  return Math.floor(deadlineSeconds);
}
