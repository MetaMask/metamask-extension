import { EthAccountType, BtcAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { selectMoneyFundingAccount } from './money-funding-account';

const HD_ADDRESS = '0x1111111111111111111111111111111111111111';
const HD_2_ADDRESS = '0x2222222222222222222222222222222222222222';
const LEDGER_ADDRESS = '0x3333333333333333333333333333333333333333';
const IMPORTED_ADDRESS = '0x4444444444444444444444444444444444444444';
const BTC_ADDRESS = 'bc1qexampleexampleexampleexampleexampleex';

const account = ({
  id,
  address,
  keyringType,
  type = EthAccountType.Eoa,
}: {
  id: string;
  address: string;
  keyringType: KeyringTypes;
  type?: string;
}) =>
  ({
    id,
    address,
    type,
    metadata: { keyring: { type: keyringType } },
  }) as unknown as InternalAccount;

const LEDGER_ACCOUNT = account({
  id: 'ledger',
  address: LEDGER_ADDRESS,
  keyringType: KeyringTypes.ledger,
});
const HD_ACCOUNT = account({
  id: 'hd',
  address: HD_ADDRESS,
  keyringType: KeyringTypes.hd,
});
const HD_2_ACCOUNT = account({
  id: 'hd-2',
  address: HD_2_ADDRESS,
  keyringType: KeyringTypes.hd,
});
const IMPORTED_ACCOUNT = account({
  id: 'imported',
  address: IMPORTED_ADDRESS,
  keyringType: KeyringTypes.simple,
});
const BTC_ACCOUNT = account({
  id: 'btc',
  address: BTC_ADDRESS,
  keyringType: KeyringTypes.snap,
  type: BtcAccountType.P2wpkh,
});

const buildState = (
  accounts: InternalAccount[],
  selectedAccount: string,
): Parameters<typeof selectMoneyFundingAccount>[0] =>
  ({
    metamask: {
      internalAccounts: {
        selectedAccount,
        accounts: accounts.reduce(
          (acc, entry) => ({ ...acc, [entry.id]: entry }),
          {},
        ),
      },
    },
  }) as unknown as Parameters<typeof selectMoneyFundingAccount>[0];

describe('selectMoneyFundingAccount', () => {
  it('returns the selected account when it is eligible', () => {
    const state = buildState([HD_ACCOUNT, LEDGER_ACCOUNT], HD_ACCOUNT.id);

    expect(selectMoneyFundingAccount(state)).toBe(HD_ACCOUNT);
  });

  it('falls back to the first eligible account when a hardware account is selected', () => {
    const state = buildState([LEDGER_ACCOUNT, HD_ACCOUNT], LEDGER_ACCOUNT.id);

    expect(selectMoneyFundingAccount(state)).toBe(HD_ACCOUNT);
  });

  it('falls back to the first eligible account in list order', () => {
    const state = buildState(
      [LEDGER_ACCOUNT, HD_ACCOUNT, HD_2_ACCOUNT],
      LEDGER_ACCOUNT.id,
    );

    expect(selectMoneyFundingAccount(state)).toBe(HD_ACCOUNT);
  });

  it('skips further hardware accounts when falling back', () => {
    const secondLedger = account({
      id: 'ledger-2',
      address: HD_2_ADDRESS,
      keyringType: KeyringTypes.trezor,
    });
    const state = buildState(
      [LEDGER_ACCOUNT, secondLedger, IMPORTED_ACCOUNT],
      LEDGER_ACCOUNT.id,
    );

    expect(selectMoneyFundingAccount(state)).toBe(IMPORTED_ACCOUNT);
  });

  it('falls back when the selected account is non-EVM', () => {
    const state = buildState([BTC_ACCOUNT, HD_ACCOUNT], BTC_ACCOUNT.id);

    expect(selectMoneyFundingAccount(state)).toBe(HD_ACCOUNT);
  });

  it('returns undefined when every account is a hardware account', () => {
    const state = buildState([LEDGER_ACCOUNT], LEDGER_ACCOUNT.id);

    expect(selectMoneyFundingAccount(state)).toBeUndefined();
  });

  it('returns undefined when there are no accounts', () => {
    expect(selectMoneyFundingAccount(buildState([], ''))).toBeUndefined();
  });
});
