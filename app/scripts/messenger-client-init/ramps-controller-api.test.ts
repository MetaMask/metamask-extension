import { getRampsControllerApi } from './ramps-controller-api';

describe('getRampsControllerApi', () => {
  it('exposes ramps background methods', () => {
    const rampsController = {
      setUserRegion: jest.fn(),
      setSelectedToken: jest.fn(),
      setSelectedProvider: jest.fn(),
      setSelectedPaymentMethod: jest.fn(),
      getTokens: jest.fn(),
      getProviders: jest.fn(),
      getPaymentMethods: jest.fn(),
      getQuotes: jest.fn(),
      getBuyWidgetData: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      addOrder: jest.fn(),
      removeOrder: jest.fn(),
      getOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    };

    const api = getRampsControllerApi(rampsController as never);

    expect(Object.keys(api).sort()).toMatchSnapshot();
    expect(typeof api.setRampsUserRegion).toBe('function');
    expect(typeof api.getRampsQuotes).toBe('function');
  });
});
