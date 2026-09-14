import { renderHook } from '@testing-library/react';
import { getMoneyTransactionDetailsRoute } from '../../helpers/constants/routes';
import { selectMoneyActivityDetailsEnabled } from '../../selectors/money/money-account-feature-flags';
import {
  onchainItem,
  accountsApiItem,
} from '../../pages/money/types/money-activity';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import { useMoneyActivityItemClick } from './use-money-activity-item-click';

const mockNavigate = jest.fn();
const mockSelectMoneyActivityDetailsEnabled = jest.mocked(
  selectMoneyActivityDetailsEnabled,
);

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  selectMoneyActivityDetailsEnabled: jest.fn(),
}));

describe('useMoneyActivityItemClick', () => {
  const item = onchainItem(MOCK_MONEY_TRANSACTIONS[0]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns undefined when details are disabled', () => {
    mockSelectMoneyActivityDetailsEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useMoneyActivityItemClick());

    expect(result.current).toBeUndefined();
  });

  it('navigates to the details route when details are enabled', () => {
    mockSelectMoneyActivityDetailsEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useMoneyActivityItemClick());

    expect(result.current).toBeDefined();
    result.current?.(item);
    expect(mockNavigate).toHaveBeenCalledWith(
      getMoneyTransactionDetailsRoute(item.id),
    );
  });

  it('does not navigate for Accounts API rows', () => {
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

    const { result } = renderHook(() => useMoneyActivityItemClick());
    result.current?.(apiItem);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
