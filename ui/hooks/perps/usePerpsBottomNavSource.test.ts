import { renderHook } from '@testing-library/react-hooks';
import { PERPS_EVENT_VALUE } from '../../../shared/constants/perps-events';
import {
  DEFAULT_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../../helpers/constants/routes';
import { usePerpsBottomNavSource } from './usePerpsBottomNavSource';

let mockPathname = DEFAULT_ROUTE;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: mockPathname }),
}));

describe('usePerpsBottomNavSource', () => {
  beforeEach(() => {
    mockPathname = DEFAULT_ROUTE;
  });

  it('returns undefined on the wallet home route', () => {
    const { result } = renderHook(() => usePerpsBottomNavSource());

    expect(result.current).toBeUndefined();
  });

  it('returns bottom_nav_bar on the perps home route', () => {
    mockPathname = PERPS_HOME_PAGE_ROUTE;

    const { result } = renderHook(() => usePerpsBottomNavSource());

    expect(result.current).toBe(PERPS_EVENT_VALUE.SOURCE.BOTTOM_NAV_BAR);
  });
});
