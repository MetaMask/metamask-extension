import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTransactionPayControllerInitMessenger,
  getTransactionPayControllerMessenger,
} from './transaction-pay-controller-messenger';

describe('getTransactionPayControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const transactionPayControllerMessenger =
      getTransactionPayControllerMessenger(messenger);

    expect(transactionPayControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates NetworkController:getNetworkConfigurationByChainId', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionPayControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'NetworkController:getNetworkConfigurationByChainId',
        ]),
      }),
    );
  });

  it('delegates the AccountTreeController actions that resolve the payment token account', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionPayControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AccountTreeController:getAccountContext',
          'AccountTreeController:getAccountGroupObject',
        ]),
      }),
    );
  });

  it('registers TokensController:getState for leftover callers', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });
    const allTokens = {
      '0x1': {
        '': [
          {
            address: '0x0000000000000000000000000000000000000001',
            symbol: 'TST',
            decimals: 18,
          },
        ],
      },
    };

    // Registered by AssetsController in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getStateForTransactionPay',
      () => ({ allTokens }),
    );

    getTransactionPayControllerMessenger(messenger);

    expect(
      // Compat action is registered on the root messenger.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (messenger as any).call('TokensController:getState'),
    ).toMatchObject({ allTokens });
  });

  it('delegates SentinelApiService:simulateTransactions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionPayControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'SentinelApiService:simulateTransactions',
        ]),
      }),
    );
  });
});

describe('getTransactionPayControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const transactionPayControllerInitMessenger =
      getTransactionPayControllerInitMessenger(messenger);

    expect(transactionPayControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates amount-commit TransactionController and AccountsController actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionPayControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AccountsController:getSelectedAccount',
          'AccountsController:getState',
          'NetworkController:getNetworkClientById',
          'TransactionController:getState',
          'TransactionController:updateTransactionMetadata',
        ]),
      }),
    );
  });
});
