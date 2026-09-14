import type { Hex } from '@metamask/utils';
import { MUSD_TOKEN_ADDRESS } from '@metamask/money-account-utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import type { MoneyAccountVaultConfig } from '../../../../shared/lib/money/vault-config';

export type MoneyAccountPayToken = {
  address: Hex;
  chainId: Hex;
};

/**
 * Resolves the pay token used when funding a confirmation from the Money
 * Account. Prefers the vault config's underlying token and chain so UI
 * selection matches the background funding batch; falls back to Monad mUSD
 * when the vault flag is unserved.
 *
 * @param vaultConfig - Parsed money-account vault config, when available.
 * @returns Pay-token address and chain id.
 */
export function getMoneyAccountPayToken(
  vaultConfig: MoneyAccountVaultConfig | undefined,
): MoneyAccountPayToken {
  return {
    address: vaultConfig?.underlyingToken ?? MUSD_TOKEN_ADDRESS,
    chainId: vaultConfig?.chainId ?? CHAIN_IDS.MONAD,
  };
}
