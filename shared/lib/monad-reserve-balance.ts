import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../constants/chain-ids';

export const MONAD_RESERVE_BALANCE_MON = '10';

const MONAD_RESERVE_BALANCE_WEI = 10n * 10n ** 18n;
const MONAD_RESERVE_BALANCE_ERROR = 'reserve balance violation';
const MONAD_RESERVE_CHAIN_IDS = new Set(
  [CHAIN_IDS.MONAD, CHAIN_IDS.MONAD_TESTNET].map((id) => id.toLowerCase()),
);

type HexString = Hex | string;
type OptionalHexString = HexString | undefined;
type SimulationData = { callTraceErrors?: string[] };
type SimulationFailure = { reason?: string; errorMessage?: string };

type MonadReserveBalanceOptions = {
  chainId: OptionalHexString;
  balance?: HexString;
  value?: HexString;
  isDelegatedAccount?: boolean;
  simulationData?: SimulationData | null;
  simulationFails?: SimulationFailure | null;
};

function isReserveBalanceError(error?: string | null): boolean {
  return Boolean(error?.toLowerCase().includes(MONAD_RESERVE_BALANCE_ERROR));
}

function hasSimulationViolation({
  simulationData,
  simulationFails,
}: Pick<
  MonadReserveBalanceOptions,
  'simulationData' | 'simulationFails'
>): boolean {
  return Boolean(
    simulationData?.callTraceErrors?.some(isReserveBalanceError) ||
    isReserveBalanceError(simulationFails?.reason) ||
    isReserveBalanceError(simulationFails?.errorMessage),
  );
}

/**
 * Returns whether a Monad transaction violates the smart-account reserve,
 * based on simulation errors or a delegated account spending below 10 MON.
 *
 * @param options - Transaction balance, value, delegation, and simulation data.
 * @returns Whether the transaction violates the Monad reserve requirement.
 */
export function hasMonadReserveBalanceViolation(
  options: MonadReserveBalanceOptions,
): boolean {
  const { chainId, balance, value, isDelegatedAccount } = options;
  if (!chainId || !MONAD_RESERVE_CHAIN_IDS.has(chainId.toLowerCase())) {
    return false;
  }

  if (hasSimulationViolation(options)) {
    return true;
  }

  if (!isDelegatedAccount || balance === undefined || value === undefined) {
    return false;
  }

  try {
    const valueInWei = BigInt(value);
    return (
      valueInWei > 0n &&
      BigInt(balance) - valueInWei < MONAD_RESERVE_BALANCE_WEI
    );
  } catch {
    return false;
  }
}
