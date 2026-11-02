import type { MoneyAccount } from '@metamask/money-account-controller';
import { isMnemonicMoneyAccount } from './money-accounts';

const MNEMONIC_MONEY_ACCOUNT: MoneyAccount = {
  id: 'money-account-1',
  type: 'eip155:eoa',
  address: '0xabcdef1234567890abcdef1234567890abcdef12',
  scopes: ['eip155:1'],
  options: {
    entropy: {
      type: 'mnemonic',
      id: 'entropy-source-1',
      derivationPath: "m/44'/4392018'/0'/0",
      groupIndex: 0,
    },
    exportable: false,
  },
  methods: ['personal_sign'],
};

const MPC_MONEY_ACCOUNT: MoneyAccount = {
  ...MNEMONIC_MONEY_ACCOUNT,
  options: {
    entropy: { type: 'mpc' },
    exportable: false,
  },
};

describe('isMnemonicMoneyAccount', () => {
  it('returns true for a mnemonic-backed (SFA) money account', () => {
    expect(isMnemonicMoneyAccount(MNEMONIC_MONEY_ACCOUNT)).toBe(true);
  });

  it('returns false for an MPC-backed (MFA) money account', () => {
    expect(isMnemonicMoneyAccount(MPC_MONEY_ACCOUNT)).toBe(false);
  });

  it('returns false for a malformed account with no entropy metadata', () => {
    const malformed = {
      ...MNEMONIC_MONEY_ACCOUNT,
      options: { exportable: false },
    } as unknown as MoneyAccount;

    expect(isMnemonicMoneyAccount(malformed)).toBe(false);
  });

  it('narrows the account so the mnemonic entropy fields are accessible', () => {
    if (!isMnemonicMoneyAccount(MNEMONIC_MONEY_ACCOUNT)) {
      throw new Error('Expected a mnemonic money account');
    }

    expect(MNEMONIC_MONEY_ACCOUNT.options.entropy.id).toBe('entropy-source-1');
    expect(MNEMONIC_MONEY_ACCOUNT.options.entropy.groupIndex).toBe(0);
    expect(MNEMONIC_MONEY_ACCOUNT.options.entropy.derivationPath).toBe(
      "m/44'/4392018'/0'/0",
    );
  });
});
