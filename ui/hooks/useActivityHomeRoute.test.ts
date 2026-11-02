import { renderHook } from '@testing-library/react';
import { ACTIVITY_ROUTE } from '../helpers/constants/routes';
import { useABTest } from './useABTest';
import {
  ACTIVITY_TAB_ROUTE,
  useActivityHomeRoute,
} from './useActivityHomeRoute';

jest.mock('./useABTest');

const mockUseABTest = jest.mocked(useABTest);

describe('useActivityHomeRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the activity page for the bottom-nav treatment', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: true },
      variantName: 'treatment',
      isActive: true,
    });

    const { result } = renderHook(() => useActivityHomeRoute());

    expect(result.current).toBe(ACTIVITY_ROUTE);
  });

  it('returns the wallet home activity tab for the bottom-nav control', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: false },
      variantName: 'control',
      isActive: true,
    });

    const { result } = renderHook(() => useActivityHomeRoute());

    expect(result.current).toBe(ACTIVITY_TAB_ROUTE);
  });
});
