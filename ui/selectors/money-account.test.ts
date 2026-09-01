import { KeyringTypes, type KeyringObject } from '@metamask/keyring-controller';
import type { MoneyAccountControllerState } from '@metamask/money-account-controller';
import { selectPrimaryMoneyAccount } from './money-account';

const PRIMARY_ID = 'primary-hd-keyring-id';
const SECOND_SRP_ID = 'second-hd-keyring-id';

const MONEY_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183';
const OTHER_MONEY_ADDRESS = '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117';

/**
 * Build a keyring entry.
 *
 * @param type - The keyring type.
 * @param id - The keyring metadata id.
 * @returns The keyring entry.
 */
const keyring = (type: string, id: string) =>
  ({
    type,
    accounts: [],
    metadata: { id, name: '' },
  }) as unknown as KeyringObject;

/**
 * Build a money account entry.
 *
 * @param address - The account address.
 * @param entropySource - The entropy source the account belongs to.
 * @returns The money account.
 */
const moneyAccount = (address: string, entropySource: string) =>
  ({
    id: `id-${entropySource}`,
    address,
    options: {
      entropy: { type: 'mnemonic', id: entropySource, groupIndex: 0 },
      exportable: false,
    },
  }) as unknown as MoneyAccountControllerState['moneyAccounts'][string];

/**
 * Build the state the selector reads.
 *
 * @param keyrings - The keyring list.
 * @param moneyAccounts - The money accounts by id.
 * @returns The state.
 */
const buildState = (
  keyrings: KeyringObject[],
  moneyAccounts?: MoneyAccountControllerState['moneyAccounts'],
) => ({ metamask: { keyrings, moneyAccounts } });

describe('selectPrimaryMoneyAccount', () => {
  it('selects the account belonging to the primary HD keyring', () => {
    const state = buildState([keyring(KeyringTypes.hd, PRIMARY_ID)], {
      'id-primary': moneyAccount(MONEY_ADDRESS, PRIMARY_ID),
    });

    expect(selectPrimaryMoneyAccount(state)?.address).toBe(MONEY_ADDRESS);
  });

  it('ignores an account belonging to a second SRP', () => {
    const state = buildState(
      [
        keyring(KeyringTypes.hd, PRIMARY_ID),
        keyring(KeyringTypes.hd, SECOND_SRP_ID),
      ],
      { 'id-second': moneyAccount(OTHER_MONEY_ADDRESS, SECOND_SRP_ID) },
    );

    expect(selectPrimaryMoneyAccount(state)).toBeUndefined();
  });

  it('resolves the primary as the first HD keyring, matching the controller', () => {
    const state = buildState(
      [
        keyring(KeyringTypes.simple, 'imported'),
        keyring(KeyringTypes.hd, PRIMARY_ID),
        keyring(KeyringTypes.hd, SECOND_SRP_ID),
      ],
      {
        'id-primary': moneyAccount(MONEY_ADDRESS, PRIMARY_ID),
        'id-second': moneyAccount(OTHER_MONEY_ADDRESS, SECOND_SRP_ID),
      },
    );

    expect(selectPrimaryMoneyAccount(state)?.address).toBe(MONEY_ADDRESS);
  });

  it('returns undefined when the controller has no accounts yet', () => {
    const state = buildState([keyring(KeyringTypes.hd, PRIMARY_ID)], {});

    expect(selectPrimaryMoneyAccount(state)).toBeUndefined();
  });

  it('returns undefined before the controller state has been mirrored', () => {
    const state = buildState([keyring(KeyringTypes.hd, PRIMARY_ID)]);

    expect(selectPrimaryMoneyAccount(state)).toBeUndefined();
  });

  it('returns undefined when there is no HD keyring', () => {
    const state = buildState([keyring(KeyringTypes.simple, 'imported')], {
      'id-primary': moneyAccount(MONEY_ADDRESS, PRIMARY_ID),
    });

    expect(selectPrimaryMoneyAccount(state)).toBeUndefined();
  });

  it('rejects an address that is not hex, rather than passing it off as one', () => {
    const state = buildState([keyring(KeyringTypes.hd, PRIMARY_ID)], {
      'id-primary': moneyAccount('not-an-address', PRIMARY_ID),
    });

    expect(selectPrimaryMoneyAccount(state)).toBeUndefined();
  });

  it('carries the rest of the account through, not just the address', () => {
    const state = buildState([keyring(KeyringTypes.hd, PRIMARY_ID)], {
      'id-primary': moneyAccount(MONEY_ADDRESS, PRIMARY_ID),
    });

    expect(selectPrimaryMoneyAccount(state)).toStrictEqual({
      id: `id-${PRIMARY_ID}`,
      address: MONEY_ADDRESS,
      options: {
        entropy: { type: 'mnemonic', id: PRIMARY_ID, groupIndex: 0 },
        exportable: false,
      },
    });
  });
});
