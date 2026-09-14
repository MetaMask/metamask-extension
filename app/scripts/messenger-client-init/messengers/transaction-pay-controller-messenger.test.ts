import { Messenger } from '@metamask/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTransactionPayControllerInitMessenger,
  getTransactionPayControllerMessenger,
} from './transaction-pay-controller-messenger';

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(() => true),
}));

describe('getTransactionPayControllerMessenger', () => {
  beforeEach(() => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
  });

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

  it('provides TokenBalancesController state backed by AssetsController', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });
    const tokenBalances = {
      '0xabc': {
        '0x1': {
          '0x0000000000000000000000000000000000000001': '0x1',
        },
      },
    };

    // This action is registered by AssetsController in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getStateForTransactionPay',
      () => ({ tokenBalances }),
    );

    const transactionPayControllerMessenger =
      getTransactionPayControllerMessenger(messenger);

    expect(
      transactionPayControllerMessenger.call(
        'TokenBalancesController:getState',
      ),
    ).toStrictEqual({ tokenBalances });
  });

  it('provides empty TokenBalancesController state when assets are excluded', () => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(false);
    const messenger = getRootMessenger<never, never>();
    const transactionPayControllerMessenger =
      getTransactionPayControllerMessenger(messenger);

    expect(
      transactionPayControllerMessenger.call(
        'TokenBalancesController:getState',
      ),
    ).toStrictEqual({ tokenBalances: {} });
  });

  it('provides TokenRatesController state backed by AssetsController', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });
    const marketData = {
      '0x1': {
        '0x0000000000000000000000000000000000000001': {
          price: 1,
          currency: 'ETH',
        },
      },
    };

    // This action is registered by AssetsController in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getStateForTransactionPay',
      () => ({ marketData }),
    );

    const transactionPayControllerMessenger =
      getTransactionPayControllerMessenger(messenger);

    expect(
      transactionPayControllerMessenger.call('TokenRatesController:getState'),
    ).toStrictEqual({ marketData });
  });

  it('provides empty TokenRatesController state when assets are excluded', () => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(false);
    const messenger = getRootMessenger<never, never>();
    const transactionPayControllerMessenger =
      getTransactionPayControllerMessenger(messenger);

    expect(
      transactionPayControllerMessenger.call('TokenRatesController:getState'),
    ).toStrictEqual({ marketData: {} });
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
          'NetworkController:getNetworkClientById',
          'TransactionController:getState',
          'TransactionController:updateTransaction',
        ]),
      }),
    );
  });
});
