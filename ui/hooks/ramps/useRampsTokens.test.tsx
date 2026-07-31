import { renderHook } from '@testing-library/react-hooks';
import { useRampsTokens } from './useRampsTokens';
import { createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsSelectedToken: jest.fn(),
}));

describe('useRampsTokens', () => {
  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsTokens(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
