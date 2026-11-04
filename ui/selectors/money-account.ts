import { createSelector } from 'reselect';
import { isStrictHexString, type Hex } from '@metamask/utils';
import { KeyringTypes, type KeyringObject } from '@metamask/keyring-controller';
import type {
  MoneyAccount,
  MoneyAccountControllerState,
} from '@metamask/money-account-controller';
import { isMnemonicMoneyAccount } from '../../shared/lib/money/money-accounts';

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

const MONEY_KEYRING_TYPES: string[] = [
  KeyringTypes.money,
  KeyringTypes.mpcMoney,
];

/**
 * Whether the given address belongs to a Money keyring (SRP-derived or MPC).
 *
 * Money keyrings cannot sign transactions (no `signTransaction`); their
 * transactions must stay externally signed and publish through the sponsored
 * relay. Money Accounts are not internal accounts, so this reads the keyring
 * list directly rather than `metadata.keyring` on an internal account.
 *
 * @param state - The MetaMask state object.
 * @param address - The account address to check.
 * @returns `true` when the address is held by a Money keyring.
 */
export function isMoneyKeyringAddress(
  state: MoneyAccountState,
  address: string | undefined,
): boolean {
  if (!address) {
    return false;
  }

  const normalizedAddress = address.toLowerCase();

  return (state.metamask.keyrings ?? []).some(
    (keyring) =>
      MONEY_KEYRING_TYPES.includes(keyring.type) &&
      keyring.accounts.some(
        (account) => account.toLowerCase() === normalizedAddress,
      ),
  );
}

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
        // MPC-backed money accounts have no entropy source ID, so they can
        // never be the primary (SRP-derived) money account.
        isMnemonicMoneyAccount(moneyAccount) &&
        moneyAccount.options.entropy.id === primaryHdKeyring.metadata.id,
    );

    if (!account || !isStrictHexString(account.address)) {
      return undefined;
    }

    return { ...account, address: account.address };
  },
);
