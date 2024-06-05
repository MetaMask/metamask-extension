import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { usePetnamesEnabled } from './usePetnamesEnabled';

jest.unmock('../../ui/hooks/usePetnamesEnabled');

type Test = {
  petnamesEnabled: boolean | undefined;
  expectedResult: boolean;
};

function createMockStateWithPetnamesEnabled(
  petnamesEnabled: Test['petnamesEnabled'],
) {
  return { metamask: { preferences: { petnamesEnabled } } };
}

describe('usePetnamesEnabled', () => {
  const tests: Test[] = [
    {
      petnamesEnabled: true,
      expectedResult: true,
    },
    {
      petnamesEnabled: false,
      expectedResult: false,
    },
    {
      // Petnames is enabled by default.
      petnamesEnabled: undefined,
      expectedResult: true,
    },
  ];

  tests.forEach(({ petnamesEnabled, expectedResult }) => {
    it(`should return ${String(
      expectedResult,
    )} when petnames preference is ${String(petnamesEnabled)}`, () => {
      const { result } = renderHookWithProvider(
        () => usePetnamesEnabled(),
        createMockStateWithPetnamesEnabled(petnamesEnabled),
      );
      expect(result.current).toBe(expectedResult);
    });
  });
});
