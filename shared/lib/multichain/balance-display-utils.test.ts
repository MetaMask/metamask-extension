import {
  getMultichainBalanceDisplayAmount,
  transformMultichainBalancesForDisplay,
} from './balance-display-utils';

describe('getMultichainBalanceDisplayAmount', () => {
  const metadata = {
    'stellar:pubnet/slip44:148': {
      units: [{ decimals: 7 }],
    },
    'tron:728126428/slip44:195': {
      units: [{ decimals: 6 }],
    },
  };

  it('converts integer smallest-unit stellar balances using metadata decimals', () => {
    expect(
      getMultichainBalanceDisplayAmount(
        '60723920',
        'stellar:pubnet/slip44:148',
        metadata,
      ),
    ).toBeCloseTo(6.072392, 6);
  });

  it('returns zero balances unchanged', () => {
    expect(
      getMultichainBalanceDisplayAmount(
        '0',
        'stellar:pubnet/slip44:148',
        metadata,
      ),
    ).toBe(0);
  });

  it('does not re-scale human-readable decimal balances', () => {
    expect(
      getMultichainBalanceDisplayAmount(
        '6.072392',
        'tron:728126428/slip44:195',
        metadata,
      ),
    ).toBeCloseTo(6.072392, 6);
  });

  it('returns numeric amount when metadata decimals are missing', () => {
    expect(
      getMultichainBalanceDisplayAmount('123', 'unknown:asset/slip44:1', {}),
    ).toBe(123);
  });
});

describe('transformMultichainBalancesForDisplay', () => {
  const metadata = {
    'stellar:pubnet/slip44:148': {
      units: [{ decimals: 7 }],
    },
  };

  it('converts smallest-unit balances for all accounts and assets', () => {
    expect(
      transformMultichainBalancesForDisplay(
        {
          'account-1': {
            'stellar:pubnet/slip44:148': {
              amount: '60723920',
              unit: 'XLM',
            },
          },
        },
        metadata,
      ),
    ).toStrictEqual({
      'account-1': {
        'stellar:pubnet/slip44:148': {
          amount: '6.072392',
          unit: 'XLM',
        },
      },
    });
  });
});
