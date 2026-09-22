import { renderHook } from '@testing-library/react';
import {
  MONEY_HOME_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { useMoneyBackNavigation } from './use-money-back-navigation';

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

describe('useMoneyBackNavigation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('goes back in history when the page was reached from another screen', () => {
    mockUseLocation.mockReturnValue({ key: 'ci9s3nlq' });

    const { result } = renderHook(() =>
      useMoneyBackNavigation(MONEY_HOME_ROUTE),
    );
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('replaces with the fallback route when the page is the first history entry', () => {
    mockUseLocation.mockReturnValue({ key: 'default' });

    const { result } = renderHook(() =>
      useMoneyBackNavigation(MONEY_HOME_ROUTE),
    );
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOME_ROUTE, {
      replace: true,
    });
  });
});
