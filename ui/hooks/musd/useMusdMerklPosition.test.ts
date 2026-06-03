import { renderHook } from '@testing-library/react-hooks';
import { useMusdMerklPosition } from './useMusdMerklPosition';

const MUSD = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../selectors/assets', () => ({
  getAssetsBySelectedAccountGroup: jest.fn(),
}));

jest.mock('../../components/app/musd/constants', () => {
  const actual = jest.requireActual('../../components/app/musd/constants');
  return {
    ...actual,
    MERKL_ELIGIBLE_MUSD_CHAIN_IDS: ['0x1', '0xe708', '0xe709'],
  };
});

const { useSelector } = jest.requireMock('react-redux');

type SelectorSetup = {
  accountGroupAssets: Record<string, unknown[]>;
};

function setupSelectors(overrides: Partial<SelectorSetup> = {}) {
  const defaults: SelectorSetup = {
    accountGroupAssets: {},
    ...overrides,
  };

  useSelector.mockImplementation(() => defaults.accountGroupAssets);
}

describe('useMusdMerklPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns zero fiat and false balance when disabled', () => {
    setupSelectors({
      accountGroupAssets: {
        '0x1': [
          {
            address: MUSD,
            balance: '1000000',
            fiat: { balance: 50 },
          },
        ],
      },
    });

    const { result } = renderHook(() => useMusdMerklPosition(false));

    expect(result.current).toEqual({
      aggregatedFiat: 0,
      hasAnyBalance: false,
    });
  });

  it('returns zero fiat and false balance when no mUSD assets exist', () => {
    setupSelectors({ accountGroupAssets: {} });

    const { result } = renderHook(() => useMusdMerklPosition());

    expect(result.current).toEqual({
      aggregatedFiat: 0,
      hasAnyBalance: false,
    });
  });

  it('aggregates mainnet mUSD fiat and detects positive balance', () => {
    setupSelectors({
      accountGroupAssets: {
        '0x1': [
          {
            address: MUSD,
            rawBalance: '0x186a0',
            balance: '100000',
            fiat: { balance: 10 },
          },
        ],
      },
    });

    const { result } = renderHook(() => useMusdMerklPosition());

    expect(result.current.aggregatedFiat).toBe(10);
    expect(result.current.hasAnyBalance).toBe(true);
  });

  it('sums fiat across mainnet and Linea Merkl-eligible holdings', () => {
    setupSelectors({
      accountGroupAssets: {
        '0x1': [{ address: MUSD, balance: '1000000', fiat: { balance: 20 } }],
        '0xe708': [
          { address: MUSD, balance: '2000000', fiat: { balance: 30 } },
        ],
      },
    });

    const { result } = renderHook(() => useMusdMerklPosition());

    expect(result.current.aggregatedFiat).toBe(50);
    expect(result.current.hasAnyBalance).toBe(true);
  });

  it('does not include BSC mUSD in aggregation', () => {
    setupSelectors({
      accountGroupAssets: {
        '0x38': [{ address: MUSD, balance: '9000000', fiat: { balance: 999 } }],
        '0x1': [{ address: MUSD, balance: '1000000', fiat: { balance: 5 } }],
      },
    });

    const { result } = renderHook(() => useMusdMerklPosition());

    expect(result.current.aggregatedFiat).toBe(5);
  });

  it('ignores non-finite fiat but still reports positive balance', () => {
    setupSelectors({
      accountGroupAssets: {
        '0x1': [
          {
            address: MUSD,
            balance: '1000000',
            fiat: { balance: Number.NaN },
          },
        ],
      },
    });

    const { result } = renderHook(() => useMusdMerklPosition());

    expect(result.current.aggregatedFiat).toBe(0);
    expect(result.current.hasAnyBalance).toBe(true);
  });
});
