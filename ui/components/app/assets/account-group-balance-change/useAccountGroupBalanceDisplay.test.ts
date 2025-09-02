import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useAccountGroupBalanceDisplay } from './useAccountGroupBalanceDisplay';
import { selectBalanceChangeBySelectedAccountGroup } from '../../../../selectors/assets';
import {
  determineBalanceColor,
  formatAmountChange,
  formatPercentageChange,
} from './get-display-balance';
import { TextColor } from '../../../../helpers/constants/design-system';
import { BalanceChangeResult } from '@metamask/assets-controllers';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getPrivacyMode } from '../../../../selectors';

// Mock all dependencies
jest.mock('react-redux');
jest.mock('../../../../ducks/locale/locale');
jest.mock('../../../../ducks/metamask/metamask');
jest.mock('../../../../selectors');
jest.mock('../../../../selectors/assets');
jest.mock('./get-display-balance');

const mockUseSelector = jest.mocked(useSelector);
const mockSelectBalanceChangeBySelectedAccountGroup = jest.mocked(
  selectBalanceChangeBySelectedAccountGroup,
);
const mockDetermineBalanceColor = jest.mocked(determineBalanceColor);
const mockFormatAmountChange = jest.mocked(formatAmountChange);
const mockFormatPercentageChange = jest.mocked(formatPercentageChange);

// type utility for testing purposes only
type MockVal = any;

describe('useAccountGroupBalanceDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockBalanceChange: BalanceChangeResult = {
      amountChangeInUserCurrency: 100.5,
      percentChange: 5.25,
      period: '1d',
      currentTotalInUserCurrency: 0,
      previousTotalInUserCurrency: 0,
      userCurrency: 'USD',
    };

    const mockBalanceSelector = jest.fn().mockReturnValue(mockBalanceChange);

    mockSelectBalanceChangeBySelectedAccountGroup.mockReturnValue(
      mockBalanceSelector as MockVal,
    );
    mockDetermineBalanceColor.mockReturnValue(TextColor.successDefault);
    mockFormatAmountChange.mockReturnValue('+$100.50');
    mockFormatPercentageChange.mockReturnValue('(+5.25%)');

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getCurrentCurrency) {
        return 'USD';
      }

      if (selector === getIntlLocale) {
        return 'en-US';
      }

      if (selector === getPrivacyMode) {
        return false;
      }

      if (selector === mockBalanceSelector) {
        return mockBalanceSelector();
      }

      throw new Error(`unmocked selector called: ${selector.name}`);
    });
  });

  it('returns correct data structure', () => {
    const { result } = renderHook(() => useAccountGroupBalanceDisplay('1d'));

    expect(result.current).toEqual({
      privacyMode: false,
      color: TextColor.successDefault,
      displayAmountChange: '+$100.50',
      displayPercentChange: '(+5.25%)',
    });

    expect(mockFormatAmountChange).toHaveBeenCalledWith(100.5, 'USD', 'en-US');
    expect(mockFormatPercentageChange).toHaveBeenCalledWith(5.25, 'en-US');
  });
});
