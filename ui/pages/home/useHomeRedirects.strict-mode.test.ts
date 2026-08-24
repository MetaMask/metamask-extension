// Must be the first import: mocks @testing-library/react to wrap renders in
// React.StrictMode, so effects run setup -> cleanup -> setup like a dev build.
import '../../../test/jest/strict-mode';

import { renderHook } from '@testing-library/react';
import { useLastVisitedPerpsRoute } from './useHomeRedirects';

describe('useLastVisitedPerpsRoute under StrictMode', () => {
  it('resumes once across the double-mount cycle', () => {
    const navigate = jest.fn();
    const clearLastVisitedPerpsRoute = jest.fn();

    renderHook(() =>
      useLastVisitedPerpsRoute({
        lastVisitedPerpsRoute: {
          paths: ['/perps/market/BTC', '/perps/trade/BTC'],
          timestamp: Date.now(),
        },
        navigate,
        clearLastVisitedPerpsRoute,
      }),
    );

    const stack = ['/perps/market/BTC', '/perps/trade/BTC'];
    expect(navigate.mock.calls).toStrictEqual(
      stack.map((path) => [path, { state: { perpsResumedStack: stack } }]),
    );
    expect(clearLastVisitedPerpsRoute).toHaveBeenCalledTimes(1);
  });
});
