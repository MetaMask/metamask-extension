import { MultichainAssetsRatesControllerState } from '@metamask/assets-controllers';

export type AssetsState = {
  metamask: MultichainAssetsRatesControllerState;
};

/**
 * Gets non-EVM accounts assets rates.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets per accounts.
 */
export function getAssetsRates(state: AssetsState) {
  return state.metamask.conversionRates;
}
