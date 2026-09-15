import { renderHook } from '@testing-library/react';
import { getMoneyTransactionDetailsRoute } from '../../helpers/constants/routes';
import { selectMoneyActivityDetailsEnabled } from '../../selectors/money/money-account-feature-flags';
import {
  onchainItem,
  accountsApiItem,
} from '../../pages/money/types/money-activity';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import {
  MoneyComponentName,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import { useMoneyAnalytics } from './useMoneyAnalytics';
import { useMoneyActivityItemClick } from './use-money-activity-item-click';

const mockNavigate = jest.fn();
const mockTrackActivitySurfaceClicked = jest.fn();
const mockSelectMoneyActivityDetailsEnabled = jest.mocked(
  selectMoneyActivityDetailsEnabled,
);
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  selectMoneyActivityDetailsEnabled: jest.fn(),
}));

jest.mock('./useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));

describe('useMoneyActivityItemClick', () => {
  const item = onchainItem(MOCK_MONEY_TRANSACTIONS[0]);
  const options = { screenName: MoneyScreenName.MoneyHome };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAnalytics.mockReturnValue({
      trackActivitySurfaceClicked: mockTrackActivitySurfaceClicked,
    } as unknown as ReturnType<typeof useMoneyAnalytics>);
  });

  it('returns undefined when details are disabled', () => {
    mockSelectMoneyActivityDetailsEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useMoneyActivityItemClick(options));

    expect(result.current).toBeUndefined();
  });

  it('tracks and navigates to the details route when details are enabled', () => {
    mockSelectMoneyActivityDetailsEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useMoneyActivityItemClick(options));

    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith(options);
    expect(result.current).toBeDefined();
    result.current?.(item);
    expect(mockTrackActivitySurfaceClicked).toHaveBeenCalledWith({
      transaction: item.tx,
      componentName: MoneyComponentName.ActivityListItem,
      redirectTarget: MoneyScreenName.MoneyActivityDetails,
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      getMoneyTransactionDetailsRoute(item.id),
    );
  });

  it('navigates to the details route for Accounts API rows without tracking', () => {
    mockSelectMoneyActivityDetailsEnabled.mockReturnValue(true);
    const apiItem = accountsApiItem({
      kind: 'card',
      hash: '0xabc',
      time: 1,
      chainId: '0x8f',
      token: {
        address: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
        symbol: 'mUSD',
        decimals: 6,
      },
      amount: '1000000',
      paidTo: '0xdef',
    });

    const { result } = renderHook(() => useMoneyActivityItemClick(options));
    result.current?.(apiItem);

    expect(mockTrackActivitySurfaceClicked).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      getMoneyTransactionDetailsRoute(apiItem.id),
    );
  });
});
