import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { MONEY_HOME_ROUTE, PREVIOUS_ROUTE } from '../helpers/constants/routes';
import { useInAppBack } from './use-in-app-back';

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

describe('useInAppBack', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('goes back when the page was reached from another in-app route', () => {
    mockUseLocation.mockReturnValue({ key: 'in-app-entry' });

    const { result } = renderHook(() => useInAppBack(MONEY_HOME_ROUTE));
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('replaces with the fallback when the page is the first route entry', () => {
    mockUseLocation.mockReturnValue({ key: 'default' });

    const { result } = renderHook(() => useInAppBack(MONEY_HOME_ROUTE));
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOME_ROUTE, {
      replace: true,
      state: { fromFreshTab: true },
    });
  });

  it('replaces with the fallback when an earlier back already replaced the entry', () => {
    mockUseLocation.mockReturnValue({
      key: 'replaced-entry',
      state: { fromFreshTab: true },
    });

    const { result } = renderHook(() => useInAppBack(MONEY_HOME_ROUTE));
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOME_ROUTE, {
      replace: true,
      state: { fromFreshTab: true },
    });
  });

  it('applies a transition only when navigating through in-app history', () => {
    mockUseLocation.mockReturnValue({ key: 'in-app-entry' });
    const transition = jest.fn((navigateBack: () => void) => navigateBack());

    const { result } = renderHook(() =>
      useInAppBack(MONEY_HOME_ROUTE, transition),
    );
    result.current();

    expect(transition).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });
});
