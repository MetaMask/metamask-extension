import { renderHook } from '@testing-library/react-hooks';
import { useRampsController } from './useRampsController';
import { createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsUserRegion: jest.fn(),
  setRampsSelectedProvider: jest.fn(),
  setRampsSelectedToken: jest.fn(),
  setRampsSelectedPaymentMethod: jest.fn(),
  getRampsProviders: jest.fn().mockResolvedValue({ providers: [] }),
  getRampsPaymentMethods: jest.fn().mockResolvedValue({ paymentMethods: [] }),
  getRampsQuotes: jest.fn(),
  getRampsBuyWidgetData: jest.fn(),
  addRampsOrder: jest.fn(),
  addRampsPrecreatedOrder: jest.fn(),
  removeRampsOrder: jest.fn(),
  refreshRampsOrder: jest.fn(),
  getRampsOrderFromCallback: jest.fn(),
}));

describe('useRampsController', () => {
  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsController(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
