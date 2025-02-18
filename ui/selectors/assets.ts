import {
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
} from '@metamask/assets-controllers';

export type AssetsState = {
  metamask: MultichainAssetsControllerState;
};

export type AssetsRatesState = {
  metamask: MultichainAssetsRatesControllerState;
};

/**
 * Gets non-EVM accounts assets.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets per accounts.
 */
export function getAccountAssets(state: AssetsState) {
  return state.metamask.accountsAssets;
}

/**
 * Gets non-EVM assets metadata.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets metadata per asset types (CAIP-19).
 */
export function getAssetsMetadata(state: AssetsState) {
  return state.metamask.assetsMetadata;
}

/**
 * Gets non-EVM accounts assets rates.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets per accounts.
 */
export function getAssetsRates(state: AssetsRatesState) {
  return state.metamask.conversionRates;
}
