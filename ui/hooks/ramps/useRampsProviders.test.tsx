import { renderHook } from '@testing-library/react-hooks';
import { useRampsProviders } from './useRampsProviders';
import { createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsSelectedProvider: jest.fn(),
  getRampsProviders: jest.fn().mockResolvedValue({ providers: [] }),
}));

describe('useRampsProviders', () => {
  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsProviders(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
