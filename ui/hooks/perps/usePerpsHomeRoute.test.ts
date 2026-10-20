import { PERPS_HOME_PAGE_ROUTE } from '../../helpers/constants/routes';
import { usePerpsHomeRoute } from './usePerpsHomeRoute';

describe('usePerpsHomeRoute', () => {
  it('returns the perps home page', () => {
    expect(usePerpsHomeRoute()).toBe(PERPS_HOME_PAGE_ROUTE);
  });
});
