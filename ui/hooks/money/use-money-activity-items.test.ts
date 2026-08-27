import { renderHook } from '@testing-library/react';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import { useMoneyActivityItems } from './use-money-activity-items';

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  ...jest.requireActual('../../selectors/money/money-account-feature-flags'),
  selectMoneyActivityMockDataEnabled: jest.fn(),
}));

const mockSelectMoneyActivityMockDataEnabled = jest.mocked(
  selectMoneyActivityMockDataEnabled,
);

describe('useMoneyActivityItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(false);
  });

  it('returns an empty list when mock data is disabled', () => {
    const { result } = renderHook(() => useMoneyActivityItems());
    expect(result.current).toStrictEqual([]);
  });

  it('returns mock transactions newest-first when mock data is enabled', () => {
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useMoneyActivityItems());

    expect(result.current).toHaveLength(MOCK_MONEY_TRANSACTIONS.length);
    expect(result.current[0].id).toBe('money-tx-deposited');
    expect(result.current.every((item) => item.kind === 'onchain')).toBe(true);
    const times = result.current.map((item) => item.time);
    expect(times).toStrictEqual([...times].sort((left, right) => right - left));
  });
});
