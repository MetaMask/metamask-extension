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

  it('delegates the actions needed to pay with a Solana source', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionPayControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'ConfigRegistryController:getNetworkConfigByCaip2ChainId',
          'ConfigRegistryController:getState',
          'SnapController:getState',
          'SnapController:handleRequest',
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

  it('delegates the actions and events needed to resume interrupted transactions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTransactionPayControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AccountTreeController:getState',
          'KeyringController:getState',
          'NetworkController:getState',
          'RampsController:getState',
          'RemoteFeatureFlagController:getState',
          'TransactionController:addTransactionBatch',
          'TransactionController:failTransaction',
          'TransactionController:finalizeResumedTransaction',
        ]),
        events: expect.arrayContaining(['KeyringController:unlock']),
      }),
    );
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
