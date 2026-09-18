import { hasProperty, isObject } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import type { Migrate } from './types';

export const version = 206;

const CHAINS_TO_MIGRATE_NATIVE_BALANCE_TO_ZERO = [
  '0x1079', // Tempo Mainnet
  '0xa5bf', // Tempo Testnet Moderato
];

const ZERO_ADDRESS = zeroAddress();
const ZERO_BALANCE = '0x0';

/**
 *
 * On Tempo, there is no native token.
 * However Tempo's RPC returns '0x9612084f0316e0ebd5182f398e5195a51b5ca47667d4c9b26c9b26c9b26c9b2'
 * as balance to `getbalance` causing a huge number to be displayed in MetaMask.
 *
 * The newest version of MetaMask hide this "non-existing native token" from everywhere in the UI.
 * It also prevents that huge balance to be stored in the state.
 * HOWEVER, if a user used Tempo before the latest version, their Tempo native balance may remain
 * "cached" in `TokenBalancesController.tokenBalances`, causing the "total USD amount" (aggregated)
 * to still show that huge number forever - since the native balance of the user will never change,
 * it would never refresh.
 *
 * This one-time migration resets the native balance to 0 (`0x0`) on Tempo chains.
 * Since the "hidding native" behavior is already in this version of MetaMask, the
 * migration should only need to run once for those users that already used Tempo before.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (
    !hasProperty(versionedData.data, 'TokenBalancesController') ||
    !isObject(versionedData.data.TokenBalancesController)
  ) {
    return;
  }

  const { TokenBalancesController } = versionedData.data;

  if (
    !hasProperty(TokenBalancesController, 'tokenBalances') ||
    !isObject(TokenBalancesController.tokenBalances)
  ) {
    return;
  }

  const { tokenBalances } = TokenBalancesController;

  let hasBeenMutatedAtLeastOnce = false;

  Object.values(tokenBalances).forEach((balancesPerChain) => {
    if (!isObject(balancesPerChain)) {
      return;
    }
    CHAINS_TO_MIGRATE_NATIVE_BALANCE_TO_ZERO.forEach((chainId) => {
      if (
        chainId in balancesPerChain &&
        isObject(balancesPerChain[chainId]) &&
        balancesPerChain[chainId][ZERO_ADDRESS] &&
        balancesPerChain[chainId][ZERO_ADDRESS] !== ZERO_BALANCE
      ) {
        // Assigns '0x0' (zero balance) if entry exists. We want balance to always be zero for those chains.
        balancesPerChain[chainId][ZERO_ADDRESS] = ZERO_BALANCE;
        hasBeenMutatedAtLeastOnce = true;
      }
    });
  });

  if (hasBeenMutatedAtLeastOnce) {
    changedControllers.add('TokenBalancesController');
  }
}) satisfies Migrate;
