import { EthScope } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';
import { isHardwareAccount } from '../components/app/rewards/utils/isHardwareAccount';
import { getInternalAccountByAddress } from '../selectors/accounts';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../selectors/multichain-accounts/account-tree';
import { isHardwareWallet } from '../../shared/lib/selectors/keyring';

/**
 * Whether the relevant account is a hardware wallet.
 *
 * Prefer an explicit `address` when available (e.g. confirmation `txParams.from`).
 * Otherwise check the selected account group's EVM account, then the globally
 * selected account.
 *
 * Selecting a Non-EVM network silently switches `selectedAccount` to a Snap
 * account while the selected group (and EVM send `from`) can still be a
 * hardware wallet — so `isHardwareWallet` alone is not enough.
 *
 * @param address - Optional account address to check.
 */
export function useIsHardwareWalletAccount(address?: string): boolean {
  const accountByAddress = useSelector((state) =>
    address ? getInternalAccountByAddress(state, address) : undefined,
  );

  const evmAccountFromSelectedGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa),
  );

  const isHardwareWalletSelected = useSelector(isHardwareWallet);

  if (accountByAddress) {
    return isHardwareAccount(accountByAddress);
  }

  if (evmAccountFromSelectedGroup) {
    return isHardwareAccount(evmAccountFromSelectedGroup);
  }

  return isHardwareWalletSelected;
}
