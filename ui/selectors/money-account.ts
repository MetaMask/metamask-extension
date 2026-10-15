import { createSelector } from 'reselect';
import { isStrictHexString, type Hex } from '@metamask/utils';
import { KeyringTypes, type KeyringObject } from '@metamask/keyring-controller';
import type {
  MoneyAccount,
  MoneyAccountControllerState,
} from '@metamask/money-account-controller';

/**
 * The Money Account as `MoneyAccountController` holds it, with the address
 * narrowed to `Hex`.
 *
 * The controller types `address` as `KeyringAccount['address']`, i.e. `string`.
 * It is always a `0x`-prefixed address in practice — it comes out of
 * `MoneyKeyring`'s derivation — but the type does not say so, and every
 * consumer here needs a `Hex`. Narrowing it once, in the selector, is cheaper
 * than an assertion at each use.
 */
export type PrimaryMoneyAccount = Omit<MoneyAccount, 'address'> & {
  address: Hex;
};

type MoneyAccountState = {
  metamask: {
    keyrings: KeyringObject[];
    moneyAccounts?: MoneyAccountControllerState['moneyAccounts'];
  };
};

const getKeyrings = (state: MoneyAccountState) => state.metamask.keyrings;

const getMoneyAccounts = (state: MoneyAccountState) =>
  state.metamask.moneyAccounts;

/**
 * Selects the Money Account belonging to the primary HD keyring, if
 * `MoneyAccountController` has created one.
 *
 * "Primary" is resolved exactly as the controller resolves it — the first
 * `HD Key Tree` keyring in `KeyringController` state — so the UI and the
 * controller cannot pick different entropy sources.
 *
 * This is `undefined` for the majority of users, and that is not an error
 * state: the controller only creates the account once the feature flag is on
 * and the wallet has been unlocked. Whether anything should be **shown** is a
 * different question, answered by `useMoneyAccountInfo`, which folds in the
 * availability gate. Do not use this selector as a visibility check.
 *
 * @param state - The MetaMask state object.
 * @returns The primary Money Account, or `undefined`.
 */
export const selectPrimaryMoneyAccount = createSelector(
  getKeyrings,
  getMoneyAccounts,
  (keyrings, moneyAccounts): PrimaryMoneyAccount | undefined => {
    const primaryHdKeyring = keyrings?.find(
      (keyring) => keyring.type === KeyringTypes.hd,
    );

    if (!primaryHdKeyring || !moneyAccounts) {
      return undefined;
    }

    const account = Object.values(moneyAccounts).find(
      (moneyAccount) =>
        moneyAccount.options.entropy.id === primaryHdKeyring.metadata.id,
    );

    if (!account || !isStrictHexString(account.address)) {
      return undefined;
    }

    return { ...account, address: account.address };
  },
);
