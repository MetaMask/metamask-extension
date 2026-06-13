import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTransactionPayControllerInitMessenger,
  getTransactionPayControllerMessenger,
} from './transaction-pay-controller-messenger';
import { getNetworkControllerMessenger } from './network-controller-messenger';

describe('getTransactionPayControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const transactionPayControllerMessenger =
      getTransactionPayControllerMessenger(messenger);

    expect(transactionPayControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates NetworkController:getNetworkConfigurationByChainId', () => {
    const messenger = getRootMessenger();
    const transactionPayControllerMessenger =
      getTransactionPayControllerMessenger(messenger);
    const networkControllerMessenger = getNetworkControllerMessenger(messenger);
    const handler = jest.fn();

    networkControllerMessenger.registerActionHandler(
      'NetworkController:getNetworkConfigurationByChainId',
      handler,
    );

    const callTransactionPayController = transactionPayControllerMessenger.call.bind(
      transactionPayControllerMessenger,
    ) as (method: string, chainId: string) => unknown;

    callTransactionPayController(
      'NetworkController:getNetworkConfigurationByChainId' as never,
      '0x1',
    );

    expect(handler).toHaveBeenCalledWith('0x1');
  });
});

describe('getTransactionPayControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const transactionPayControllerInitMessenger =
      getTransactionPayControllerInitMessenger(messenger);

    expect(transactionPayControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
