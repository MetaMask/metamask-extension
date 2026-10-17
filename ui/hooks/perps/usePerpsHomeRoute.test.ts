import { renderHook } from '@testing-library/react';
import { PERPS_HOME_PAGE_ROUTE } from '../../helpers/constants/routes';
import { useABTest } from '../useABTest';
import { PERPS_HOME_TAB_ROUTE, usePerpsHomeRoute } from './usePerpsHomeRoute';

jest.mock('../useABTest');

const mockUseABTest = jest.mocked(useABTest);

describe('usePerpsHomeRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the perps home page for the bottom-nav treatment', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: true },
      variantName: 'treatment',
      isActive: true,
    });

    const { result } = renderHook(() => usePerpsHomeRoute());

    expect(result.current).toBe(PERPS_HOME_PAGE_ROUTE);
  });

  it('returns the wallet home perps tab for the bottom-nav control', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: false },
      variantName: 'control',
      isActive: true,
    });

    const { result } = renderHook(() => usePerpsHomeRoute());

    expect(result.current).toBe(PERPS_HOME_TAB_ROUTE);
  });
});
