import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getSmartTransactionsControllerMessenger } from './smart-transactions-controller-messenger';

describe('getSmartTransactionsControllerMessenger', () => {
  it('delegates SentinelApiService actions the controller calls', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getSmartTransactionsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'SentinelApiService:batchStatus',
          'SentinelApiService:cancel',
          'SentinelApiService:getFees',
          'SentinelApiService:getNetwork',
          'SentinelApiService:submitTransactions',
        ]),
      }),
    );
  });

  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const controllerMessenger =
      getSmartTransactionsControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });
});
