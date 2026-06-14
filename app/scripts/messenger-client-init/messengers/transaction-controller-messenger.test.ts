import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTransactionControllerInitMessenger,
  getTransactionControllerMessenger,
} from './transaction-controller-messenger';

describe('getTransactionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const transactionControllerMessenger =
      getTransactionControllerMessenger(messenger);

    expect(transactionControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getTransactionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const transactionControllerInitMessenger =
      getTransactionControllerInitMessenger(messenger);

    expect(transactionControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates TransactionPayController:getDelegationTransaction', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'TransactionPayController:getDelegationTransaction',
        ]),
      }),
    );
  });
});
