import {
  EthAccountType,
  EthScope,
  BtcAccountType,
  SolAccountType,
  SolScope,
} from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  AccountGroupType,
  AccountWalletType,
  type AccountGroupId,
} from '@metamask/account-api';
import { selectMoneyFundingAccount } from './money-funding-account';

const HD_ADDRESS = '0x1111111111111111111111111111111111111111';
const HD_2_ADDRESS = '0x2222222222222222222222222222222222222222';
const LEDGER_ADDRESS = '0x3333333333333333333333333333333333333333';
const IMPORTED_ADDRESS = '0x4444444444444444444444444444444444444444';
const BTC_ADDRESS = 'bc1qexampleexampleexampleexampleexampleex';
const SOL_ADDRESS = 'So1anaExampleExampleExampleExampleExampleEx';

const account = ({
  id,
  address,
  keyringType,
  type = EthAccountType.Eoa,
  scopes = [EthScope.Eoa],
}: {
  id: string;
  address: string;
  keyringType: KeyringTypes;
  type?: string;
  scopes?: string[];
}) =>
  ({
    id,
    address,
    type,
    scopes,
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
  scopes: ['bip122:000000000019d6689c085ae165831e93'],
});
const SOL_ACCOUNT = account({
  id: 'sol',
  address: SOL_ADDRESS,
  keyringType: KeyringTypes.snap,
  type: SolAccountType.DataAccount,
  scopes: [SolScope.Mainnet],
});

const WALLET_ID = 'entropy:wallet';
const GROUP_1_ID = `${WALLET_ID}/0` as AccountGroupId;
const GROUP_2_ID = `${WALLET_ID}/1` as AccountGroupId;

const buildGroup = (id: AccountGroupId, accounts: InternalAccount[]) => ({
  id,
  type: AccountGroupType.MultichainAccount,
  accounts: accounts.map((entry) => entry.id),
  metadata: {
    name: id,
    entropy: { groupIndex: 0 },
    pinned: false,
    hidden: false,
    lastSelected: 0,
  },
});

const buildState = (
  accounts: InternalAccount[],
  selectedAccount: string,
  groups: {
    selectedAccountGroup: AccountGroupId;
    byId: Record<AccountGroupId, InternalAccount[]>;
  } = { selectedAccountGroup: '' as AccountGroupId, byId: {} },
): Parameters<typeof selectMoneyFundingAccount>[0] =>
  ({
    metamask: {
      selectedAccountGroup: groups.selectedAccountGroup,
      accountTree: {
        wallets: {
          [WALLET_ID]: {
            id: WALLET_ID,
            type: AccountWalletType.Entropy,
            status: 'ready',
            groups: Object.fromEntries(
              Object.entries(groups.byId).map(([id, groupAccounts]) => [
                id,
                buildGroup(id as AccountGroupId, groupAccounts),
              ]),
            ),
            metadata: { name: 'Wallet', entropy: { id: 'wallet' } },
          },
        },
      },
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
  describe('with a selected account group', () => {
    it("returns the group's EVM account when a non-EVM account in it is selected", () => {
      const state = buildState(
        [HD_ACCOUNT, SOL_ACCOUNT, HD_2_ACCOUNT],
        SOL_ACCOUNT.id,
        {
          selectedAccountGroup: GROUP_2_ID,
          byId: {
            [GROUP_1_ID]: [HD_ACCOUNT],
            [GROUP_2_ID]: [HD_2_ACCOUNT, SOL_ACCOUNT],
          },
        },
      );

      expect(selectMoneyFundingAccount(state)).toBe(HD_2_ACCOUNT);
    });

    it("returns the group's EVM account when it is selected", () => {
      const state = buildState([HD_ACCOUNT, HD_2_ACCOUNT], HD_2_ACCOUNT.id, {
        selectedAccountGroup: GROUP_2_ID,
        byId: { [GROUP_1_ID]: [HD_ACCOUNT], [GROUP_2_ID]: [HD_2_ACCOUNT] },
      });

      expect(selectMoneyFundingAccount(state)).toBe(HD_2_ACCOUNT);
    });

    it("falls back to the first eligible account when the group's EVM account is hardware", () => {
      const state = buildState(
        [HD_ACCOUNT, LEDGER_ACCOUNT, SOL_ACCOUNT],
        SOL_ACCOUNT.id,
        {
          selectedAccountGroup: GROUP_2_ID,
          byId: {
            [GROUP_1_ID]: [HD_ACCOUNT],
            [GROUP_2_ID]: [LEDGER_ACCOUNT, SOL_ACCOUNT],
          },
        },
      );

      expect(selectMoneyFundingAccount(state)).toBe(HD_ACCOUNT);
    });

    it('falls back to the first eligible account when the group has no EVM account', () => {
      const state = buildState([HD_ACCOUNT, SOL_ACCOUNT], SOL_ACCOUNT.id, {
        selectedAccountGroup: GROUP_2_ID,
        byId: { [GROUP_1_ID]: [HD_ACCOUNT], [GROUP_2_ID]: [SOL_ACCOUNT] },
      });

      expect(selectMoneyFundingAccount(state)).toBe(HD_ACCOUNT);
    });
  });

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
