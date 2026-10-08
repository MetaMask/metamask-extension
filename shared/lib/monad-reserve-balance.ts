import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../constants/chain-ids';

/**
 * Monad protocol reserve balance (see https://docs.monad.xyz/developer-essentials/reserve-balance).
 *
 * Execution reverts when an account's ending MON balance dips below this reserve
 * (stricter for EIP-7702 / Smart Accounts). MetaMask gas sponsorship simulation
 * surfaces that as `"reserve balance violation"`.
 *
 * For the sender, gas may come from the reserve, so a positive value spend must
 * leave at least 10 MON (`balance - value >= reserve`). A zero `value` does not
 * decrement the balance, so Monad still accepts that gas-only call when the
 * account is already below the reserve.
 *
 * Related: https://github.com/MetaMask/metamask-extension/issues/42068
 */
export const MONAD_RESERVE_BALANCE_MON = '10';

/** CAIP chain id for Monad mainnet (`eip155:143`). */
export const MONAD_MAINNET_CAIP_CHAIN_ID = 'eip155:143' as const;

/** Substring matchers for simulation / estimate errors. */
export const MONAD_RESERVE_BALANCE_ERROR_MATCHERS = [
  'reserve balance violation',
] as const;

/** 10 MON in wei (hex). */
export const MONAD_RESERVE_BALANCE_WEI_HEX =
  `0x${(10n * 10n ** 18n).toString(16)}` as Hex;

const MONAD_RESERVE_BALANCE_WEI = 10n * 10n ** 18n;

type HexString = Hex | string;
type OptionalHexString = HexString | undefined;
type OptionalNullableString = string | undefined | null;

const MONAD_RESERVE_CHAIN_IDS = new Set(
  [CHAIN_IDS.MONAD, CHAIN_IDS.MONAD_TESTNET].map((id) => id.toLowerCase()),
);

/**
 * Parse a hex quantity to bigint. Invalid / empty values become 0n.
 *
 * @param value - Hex wei string.
 * @returns Parsed bigint amount.
 */
function hexToBigInt(value: OptionalHexString): bigint {
  if (!value) {
    return 0n;
  }
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

/**
 * Whether the chain enforces Monad-style native reserve balance rules.
 *
 * @param chainId - Hex chain id.
 * @returns True for Monad mainnet and testnet.
 */
export function hasMonadReserveBalanceRule(
  chainId: OptionalHexString,
): boolean {
  if (!chainId) {
    return false;
  }
  return MONAD_RESERVE_CHAIN_IDS.has(chainId.toLowerCase());
}

/**
 * Whether an error string indicates a Monad reserve-balance violation.
 *
 * @param error - Raw error / call-trace message.
 * @returns True when a known matcher is present.
 */
export function isMonadReserveBalanceError(
  error: OptionalNullableString,
): boolean {
  if (!error) {
    return false;
  }
  const normalized = error.toLowerCase();
  return MONAD_RESERVE_BALANCE_ERROR_MATCHERS.some((matcher) =>
    normalized.includes(matcher),
  );
}

type SimulationLike = {
  callTraceErrors?: string[];
};

type SimulationFailsLike = {
  reason?: string;
  errorMessage?: string;
};

/**
 * Detects reserve-balance violations from transaction simulation metadata.
 *
 * Checks `simulationData.callTraceErrors` and `simulationFails` reason/message
 * so confirmations still surface the correct alert when estimateGas fails
 * without populating call-trace errors.
 *
 * @param options - Simulation payloads from TransactionMeta.
 * @param options.simulationData
 * @param options.simulationFails
 * @returns True when any payload indicates a reserve violation.
 */
export function simulationIndicatesMonadReserveBalanceViolation({
  simulationData,
  simulationFails,
}: {
  simulationData?: SimulationLike | null;
  simulationFails?: SimulationFailsLike | null;
}): boolean {
  const callTraceErrors = simulationData?.callTraceErrors;
  if (callTraceErrors?.some((error) => isMonadReserveBalanceError(error))) {
    return true;
  }

  if (isMonadReserveBalanceError(simulationFails?.reason)) {
    return true;
  }

  if (isMonadReserveBalanceError(simulationFails?.errorMessage)) {
    return true;
  }

  return false;
}

/**
 * Proactive check: after spending `value`, would remaining native balance fall
 * below the Monad reserve? Gas is excluded because protocol allows gas to come
 * from the reserve for the sender.
 *
 * Only applies to EIP-7702 delegated (smart) accounts, and only when `value`
 * actually debits the account. Monad reverts a delegated account when its
 * balance decrements and ends below 10 MON. A gas-only call (`value` of 0)
 * leaves the balance unchanged, so the network still mines it when the account
 * is already under the reserve.
 *
 * Undelegated EOAs may dip below the reserve through the protocol's "emptying
 * transaction" exception, so the network accepts e.g. a 15 MON account sending
 * 6 MON or a gas-only call from an account already under 10 MON.
 *
 * `TransactionMeta.delegationAddress` is `undefined` both for undelegated
 * accounts and while the lookup is still pending, so callers cannot express an
 * "unknown" state. Anything other than a confirmed delegation therefore skips
 * the proactive check and relies on the simulation-based detection in
 * `simulationIndicatesMonadReserveBalanceViolation`.
 *
 * @param options - Chain, balance, and tx value (hex wei).
 * @param options.chainId
 * @param options.balance
 * @param options.value
 * @param options.isDelegatedAccount - True when the sender is EIP-7702 delegated.
 * @returns True when a delegated sender's positive value spend would leave less than 10 MON.
 */
export function wouldViolateMonadReserveBalance({
  chainId,
  balance,
  value,
  isDelegatedAccount,
}: {
  chainId: OptionalHexString;
  balance: OptionalHexString;
  value: OptionalHexString;
  isDelegatedAccount?: boolean;
}): boolean {
  if (
    !hasMonadReserveBalanceRule(chainId) ||
    balance === undefined ||
    value === undefined
  ) {
    return false;
  }

  // Undelegated accounts can empty below 10 MON. Unknown delegation status
  // skips this check and relies on simulation.
  if (!isDelegatedAccount) {
    return false;
  }

  const valueWei = hexToBigInt(value);
  // Zero value does not decrement the balance. Monad still accepts the call.
  if (valueWei <= 0n) {
    return false;
  }

  const remaining = hexToBigInt(balance) - valueWei;
  return remaining < MONAD_RESERVE_BALANCE_WEI;
}

/**
 * Whether confirmations should treat this tx as a Monad reserve-balance failure
 * (simulation error and/or proactive value check).
 *
 * @param options - Chain + balances + simulation fields from TransactionMeta.
 * @param options.chainId
 * @param options.balance
 * @param options.value
 * @param options.isDelegatedAccount - True when the sender is EIP-7702 delegated.
 * @param options.simulationData
 * @param options.simulationFails
 * @returns True when the reserve alert should take precedence over generic fee alerts.
 */
export function hasMonadReserveBalanceViolation({
  chainId,
  balance,
  value,
  isDelegatedAccount,
  simulationData,
  simulationFails,
}: {
  chainId: OptionalHexString;
  balance?: HexString;
  value?: HexString;
  isDelegatedAccount?: boolean;
  simulationData?: SimulationLike | null;
  simulationFails?: SimulationFailsLike | null;
}): boolean {
  if (!hasMonadReserveBalanceRule(chainId)) {
    return false;
  }

  if (
    simulationIndicatesMonadReserveBalanceViolation({
      simulationData,
      simulationFails,
    })
  ) {
    return true;
  }

  return wouldViolateMonadReserveBalance({
    chainId,
    balance,
    value,
    isDelegatedAccount,
  });
}
