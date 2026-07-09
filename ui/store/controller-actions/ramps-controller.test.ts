import * as BackgroundConnectionModule from '../background-connection';
import {
  addRampsOrder,
  addRampsPrecreatedOrder,
  getRampsBuyWidgetData,
  getRampsOrderFromCallback,
  getRampsPaymentMethods,
  getRampsProviders,
  getRampsQuotes,
  getRampsTokens,
  refreshRampsOrder,
  removeRampsOrder,
  setRampsSelectedPaymentMethod,
  setRampsSelectedProvider,
  setRampsSelectedToken,
  setRampsUserRegion,
} from './ramps-controller';

jest.mock('../background-connection');

describe('ramps-controller actions', () => {
  const mockSubmitRequestToBackground = jest.spyOn(
    BackgroundConnectionModule,
    'submitRequestToBackground',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  it('matches snapshot for background action calls', async () => {
    const quoteParams = {
      amount: 100,
      walletAddress: '0xabc',
      assetId: 'eip155:1/erc20:0x0',
    };
    const quote = { id: 'quote-1' } as never;
    const order = { id: 'order-1', providerOrderId: 'abc' } as never;
    const precreatedOrderParams = {
      orderId: 'order-1',
      providerCode: 'transak',
      walletAddress: '0xabc',
    };

    await setRampsUserRegion('us-ca', { forceRefresh: true });
    await setRampsSelectedToken('eip155:1/erc20:0x0');
    await setRampsSelectedProvider('transak', { autoSelected: true });
    await setRampsSelectedPaymentMethod('credit_debit_card');
    await getRampsTokens('us-ca');
    await getRampsTokens('us-ca', 'sell');
    await getRampsProviders('us-ca');
    await getRampsPaymentMethods('us-ca', {
      fiat: 'USD',
      assetId: 'eip155:1/erc20:0x0',
      provider: 'transak',
    });
    await getRampsQuotes(quoteParams);
    await getRampsBuyWidgetData(quote);
    await addRampsPrecreatedOrder(precreatedOrderParams);
    await addRampsOrder(order);
    await removeRampsOrder('order-1');
    await refreshRampsOrder('transak', 'order-1', '0xabc');
    await getRampsOrderFromCallback('transak', 'https://callback', '0xabc');

    expect(mockSubmitRequestToBackground.mock.calls).toMatchSnapshot();
  });
});
