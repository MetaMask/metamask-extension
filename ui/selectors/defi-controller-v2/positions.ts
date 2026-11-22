import type { DeFiPositionsControllerV2State } from '@metamask/assets-controllers';

export type DeFiPositionsV2State = {
  metamask: DeFiPositionsControllerV2State;
};

/**
 * Selects the DeFi positions stored by `DeFiPositionsControllerV2`, keyed by
 * internal MetaMask account ID. This is the shape the DeFi tab consumes
 * directly, so no further transformation is needed on read.
 *
 * @param state - Redux state object.
 * @returns DeFi positions by account ID (empty object when unset).
 */
export function getDeFiPositionsV2(
  state: DeFiPositionsV2State,
): DeFiPositionsControllerV2State['allDeFiPositionsV2'] {
  return state?.metamask?.allDeFiPositionsV2 ?? {};
}
