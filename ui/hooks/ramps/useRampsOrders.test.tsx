import { renderHook } from '@testing-library/react-hooks';
import { useRampsOrders } from './useRampsOrders';
import { createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  addRampsOrder: jest.fn(),
  addRampsPrecreatedOrder: jest.fn(),
  removeRampsOrder: jest.fn(),
  refreshRampsOrder: jest.fn(),
  getRampsOrderFromCallback: jest.fn(),
}));

describe('useRampsOrders', () => {
  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsOrders(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
