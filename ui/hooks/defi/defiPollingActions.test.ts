import { setBackgroundConnection } from '../../store/background-connection';
import { deFiStartPolling, deFiStopPolling } from './defiPollingActions';

describe('deFiStartPolling', () => {
  it('starts polling through the DeFi positions controller', async () => {
    const messengerCall = jest.fn().mockResolvedValue('defi-token');
    // @ts-expect-error Only the messenger RPC method is needed for this test.
    setBackgroundConnection({ messengerCall });

    const pollingToken = await deFiStartPolling();

    expect(pollingToken).toBe('defi-token');
    expect(messengerCall).toHaveBeenCalledWith(
      'DeFiPositionsController:startPolling',
      [null],
    );
  });
});

describe('deFiStopPolling', () => {
  it('stops polling through the DeFi positions controller', async () => {
    const messengerCall = jest.fn().mockResolvedValue(undefined);
    // @ts-expect-error Only the messenger RPC method is needed for this test.
    setBackgroundConnection({ messengerCall });

    await deFiStopPolling('defi-token');

    expect(messengerCall).toHaveBeenCalledWith(
      'DeFiPositionsController:stopPollingByPollingToken',
      ['defi-token'],
    );
  });
});
