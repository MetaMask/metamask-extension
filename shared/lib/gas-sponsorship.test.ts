import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  getIsGasFeeSponsored,
  isGasFeeSponsorshipPossible,
  isGasFeeSponsorshipRequired,
  isMoneyAccountSponsorship,
} from './gas-sponsorship';

const TRANSACTION_MOCK: TransactionMeta = {
  chainId: '0x1',
  id: '123',
  networkClientId: 'test-network',
  status: TransactionStatus.unapproved,
  time: 1,
  txParams: {
    from: '0x0000000000000000000000000000000000000001',
  },
};

const CAPABILITIES_MOCK = {
  isGaslessSupported: true,
  isOptedOut: false,
};

describe('isGasFeeSponsorshipPossible', () => {
  it('returns true when sponsorship is available', () => {
    expect(
      isGasFeeSponsorshipPossible({
        ...TRANSACTION_MOCK,
        isGasFeeSponsoredAvailable: true,
      }),
    ).toBe(true);
  });

  it('returns true when sponsorship is required by the creator', () => {
    expect(
      isGasFeeSponsorshipPossible({
        ...TRANSACTION_MOCK,
        forceIsGasFeeSponsored: true,
      }),
    ).toBe(true);
  });

  it('returns false when sponsorship is neither available nor required', () => {
    expect(isGasFeeSponsorshipPossible(TRANSACTION_MOCK)).toBe(false);
  });

  it('ignores the post-publish sponsorship record', () => {
    expect(
      isGasFeeSponsorshipPossible({
        ...TRANSACTION_MOCK,
        isGasFeeSponsored: true,
      }),
    ).toBe(false);
  });

  it('returns false for revoke delegation transactions', () => {
    expect(
      isGasFeeSponsorshipPossible({
        ...TRANSACTION_MOCK,
        isGasFeeSponsoredAvailable: true,
        type: TransactionType.revokeDelegation,
      }),
    ).toBe(false);
  });

  it('returns false without a transaction', () => {
    expect(isGasFeeSponsorshipPossible(undefined)).toBe(false);
  });
});

describe('isGasFeeSponsorshipRequired', () => {
  it('returns true for Money Account withdrawals', () => {
    expect(
      isGasFeeSponsorshipRequired({
        ...TRANSACTION_MOCK,
        type: TransactionType.moneyAccountWithdraw,
      }),
    ).toBe(true);
  });

  it('returns false for other transactions', () => {
    expect(
      isGasFeeSponsorshipRequired({
        ...TRANSACTION_MOCK,
        type: TransactionType.moneyAccountDeposit,
      }),
    ).toBe(false);
  });
});

describe('isMoneyAccountSponsorship', () => {
  it('returns true for Money Account deposits', () => {
    expect(
      isMoneyAccountSponsorship({
        ...TRANSACTION_MOCK,
        type: TransactionType.moneyAccountDeposit,
      }),
    ).toBe(true);
  });

  it('returns true for Money Account withdrawals', () => {
    expect(
      isMoneyAccountSponsorship({
        ...TRANSACTION_MOCK,
        type: TransactionType.moneyAccountWithdraw,
      }),
    ).toBe(true);
  });

  it('returns false for other transactions', () => {
    expect(
      isMoneyAccountSponsorship({
        ...TRANSACTION_MOCK,
        type: TransactionType.simpleSend,
      }),
    ).toBe(false);
  });
});

describe('getIsGasFeeSponsored', () => {
  const availableTransaction = {
    ...TRANSACTION_MOCK,
    isGasFeeSponsoredAvailable: true,
  };

  it('returns true when available and gasless is supported', () => {
    expect(getIsGasFeeSponsored(availableTransaction, CAPABILITIES_MOCK)).toBe(
      true,
    );
  });

  it('returns false when sponsorship is not possible', () => {
    expect(getIsGasFeeSponsored(TRANSACTION_MOCK, CAPABILITIES_MOCK)).toBe(
      false,
    );
  });

  it('returns false when the user opted out', () => {
    expect(
      getIsGasFeeSponsored(availableTransaction, {
        ...CAPABILITIES_MOCK,
        isOptedOut: true,
      }),
    ).toBe(false);
  });

  it('returns false when gasless is not supported', () => {
    expect(
      getIsGasFeeSponsored(availableTransaction, {
        ...CAPABILITIES_MOCK,
        isGaslessSupported: false,
      }),
    ).toBe(false);
  });

  it('returns true for Money Account transactions without gasless support', () => {
    expect(
      getIsGasFeeSponsored(
        {
          ...TRANSACTION_MOCK,
          forceIsGasFeeSponsored: true,
          type: TransactionType.moneyAccountDeposit,
        },
        { ...CAPABILITIES_MOCK, isGaslessSupported: false },
      ),
    ).toBe(true);
  });
});
