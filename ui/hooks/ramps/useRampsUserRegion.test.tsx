import { renderHook } from '@testing-library/react-hooks';
import { useRampsUserRegion } from './useRampsUserRegion';
import { createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsUserRegion: jest.fn(),
}));

describe('useRampsUserRegion', () => {
  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsUserRegion(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
