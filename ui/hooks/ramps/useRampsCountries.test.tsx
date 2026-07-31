import { renderHook } from '@testing-library/react-hooks';
import { useRampsCountries } from './useRampsCountries';
import { createRampsTestWrapper } from './test-utils';

describe('useRampsCountries', () => {
  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsCountries(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
