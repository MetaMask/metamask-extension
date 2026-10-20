import { ACTIVITY_ROUTE } from '../helpers/constants/routes';
import { useActivityHomeRoute } from './useActivityHomeRoute';

describe('useActivityHomeRoute', () => {
  it('returns the activity page', () => {
    expect(useActivityHomeRoute()).toBe(ACTIVITY_ROUTE);
  });
});
