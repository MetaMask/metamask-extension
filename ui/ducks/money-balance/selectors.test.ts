import type { Hex } from '@metamask/utils';
import type { MetaMaskReduxState } from '../../store/store';
import {
  selectLastKnownMoneyBalance,
  isPersistedMoneyBalanceUsable,
} from './selectors';
import { initialState, type PersistedMoneyBalance } from '.';

const ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' as Hex;
const OTHER_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;

const balance: PersistedMoneyBalance = {
  address: ADDRESS,
  value: '$2,384.34',
  updatedAt: 1700000000000,
};

const buildState = (lastKnownBalance: PersistedMoneyBalance | null) =>
  ({
    moneyBalance: { lastKnownBalance },
  }) as unknown as MetaMaskReduxState;

describe('selectLastKnownMoneyBalance', () => {
  it('returns the stored balance', () => {
    expect(selectLastKnownMoneyBalance(buildState(balance))).toStrictEqual(
      balance,
    );
  });

  it('returns null when nothing has been stored', () => {
    expect(
      selectLastKnownMoneyBalance(buildState(initialState.lastKnownBalance)),
    ).toBeNull();
  });
});

describe('isPersistedMoneyBalanceUsable', () => {
  const inView = { address: ADDRESS };

  it('is true when the address matches what is in view', () => {
    expect(isPersistedMoneyBalanceUsable(balance, inView)).toBe(true);
  });

  it('is true when the addresses differ only in checksum casing', () => {
    expect(
      isPersistedMoneyBalanceUsable(
        { ...balance, address: ADDRESS.toLowerCase() as Hex },
        inView,
      ),
    ).toBe(true);
  });

  it('is true regardless of how old the persisted balance is', () => {
    expect(
      isPersistedMoneyBalanceUsable({ ...balance, updatedAt: 0 }, inView),
    ).toBe(true);
  });

  // The failure mode this guard exists to prevent: showing a figure that
  // belongs to another account.
  const unusable: [string, PersistedMoneyBalance | null | undefined][] = [
    ['there is no persisted balance', null],
    ['the persisted balance is undefined', undefined],
    [
      'the persisted address is a different account',
      { ...balance, address: OTHER_ADDRESS },
    ],
    ['the persisted address is empty', { ...balance, address: '' as Hex }],
  ];

  for (const [description, persisted] of unusable) {
    it(`is false when ${description}`, () => {
      expect(isPersistedMoneyBalanceUsable(persisted, inView)).toBe(false);
    });
  }

  const noAccountInView: [string, { address?: Hex }][] = [
    ['no address is in view yet', { address: undefined }],
    ['the address in view is empty', { address: '' as Hex }],
  ];

  for (const [description, target] of noAccountInView) {
    it(`is false when ${description}`, () => {
      expect(isPersistedMoneyBalanceUsable(balance, target)).toBe(false);
    });
  }
});
