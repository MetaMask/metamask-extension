import {
  ROUTES,
  getPaths,
  PATH_NAME_MAP,
  DEVELOPER_OPTIONS_ROUTE,
} from './routes';

describe('Routes Constants', () => {
  describe('ROUTES Array', () => {
    it('is an array of AppRoute objects', () => {
      expect(Array.isArray(ROUTES)).toBe(true);
      expect(ROUTES.length).toBeGreaterThan(0);
    });

    it('has all required properties for each route', () => {
      ROUTES.forEach((route) => {
        expect(route).toHaveProperty('path');
        expect(route).toHaveProperty('label');
        expect(route).toHaveProperty('trackInAnalytics');

        expect(typeof route.path).toBe('string');
        expect(typeof route.label).toBe('string');
        expect(typeof route.trackInAnalytics).toBe('boolean');
      });
    });

    it('has unique paths', () => {
      const paths = ROUTES.map((route) => route.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    });
  });

  describe('getPaths Function', () => {
    it('returns an array of strings', () => {
      const result = getPaths();
      expect(Array.isArray(result)).toBe(true);
      result.forEach((path) => {
        expect(typeof path).toBe('string');
      });
    });

    it('only returns paths where trackInAnalytics is true', () => {
      const result = getPaths();
      const trackedRoutes = ROUTES.filter((route) => route.trackInAnalytics);
      const expectedPaths = trackedRoutes.map((route) => route.path);

      expect(result).toEqual(expectedPaths);
    });

    it('is memoized (returns same reference for same input)', () => {
      const result1 = getPaths();
      const result2 = getPaths();
      expect(result1).toBe(result2); // Same reference, not just equal values
    });

    it('excludes developer options and other non-tracked routes', () => {
      const result = getPaths();
      expect(result).not.toContain(DEVELOPER_OPTIONS_ROUTE);

      // Find routes with trackInAnalytics: false
      const untrackedRoutes = ROUTES.filter((route) => !route.trackInAnalytics);
      untrackedRoutes.forEach((route) => {
        expect(result).not.toContain(route.path);
      });
    });
  });

  describe('Route Constants Integration', () => {
    it('PATH_NAME_MAP size and getPaths() length match analytics-tracked routes only', () => {
      const trackedRoutesCount = ROUTES.filter(
        (route) => route.trackInAnalytics,
      ).length;
      expect(PATH_NAME_MAP.size).toBe(trackedRoutesCount);
      expect(getPaths().length).toBe(trackedRoutesCount);
    });

    it('excludes non-analytics routes from PATH_NAME_MAP', () => {
      const nonTrackedRoutes = ROUTES.filter(
        (route) => !route.trackInAnalytics,
      );
      nonTrackedRoutes.forEach((route) => {
        expect(PATH_NAME_MAP.has(route.path)).toBe(false);
      });
    });

    it('maintains consistency between getPaths and PATH_NAME_MAP', () => {
      const trackedRoutes = ROUTES.filter((route) => route.trackInAnalytics);

      trackedRoutes.forEach((route) => {
        expect(PATH_NAME_MAP.has(route.path)).toBe(true);
        expect(typeof PATH_NAME_MAP.get(route.path)).toBe('string');
      });
    });

    it('handles parameterized routes correctly', () => {
      const parameterizedRoutes = ROUTES.filter((route) =>
        route.path.includes(':'),
      );

      // Verify we have some parameterized routes to test
      expect(parameterizedRoutes.length).toBeGreaterThan(0);

      parameterizedRoutes.forEach((route) => {
        // PATH_NAME_MAP presence should match trackInAnalytics flag
        expect(PATH_NAME_MAP.has(route.path)).toBe(route.trackInAnalytics);

        // If tracked for analytics, should be in getPaths() too
        if (route.trackInAnalytics) {
          expect(getPaths()).toContain(route.path);
        } else {
          expect(getPaths()).not.toContain(route.path);
        }
      });
    });
  });
});
