import { renderHook } from '@testing-library/react-hooks';
import { useRampsPaymentMethods } from './useRampsPaymentMethods';
import { createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsSelectedPaymentMethod: jest.fn(),
  getRampsPaymentMethods: jest.fn(),
}));

describe('useRampsPaymentMethods', () => {
  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsPaymentMethods(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
