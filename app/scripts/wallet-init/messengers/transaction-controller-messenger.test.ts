import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getTransactionControllerInitMessenger } from './transaction-controller-messenger';

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
          'TransactionPayController:getAmountData',
          'TransactionPayController:getDelegationTransaction',
          'TransactionPayController:getPaymentOverrideData',
        ]),
      }),
    );
  });

  it('delegates the actions used by the Solana Pay publish path', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'ConfigRegistryController:getNetworkConfigByCaip2ChainId',
          'SnapController:handleRequest',
          'TransactionPayController:getInfuraProjectId',
          'TransactionPayController:reconcileSolanaPay',
        ]),
      }),
    );
  });
});
