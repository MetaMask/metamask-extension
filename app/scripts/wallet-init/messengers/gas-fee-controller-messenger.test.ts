import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getGasFeeControllerInitMessenger } from './gas-fee-controller-messenger';

describe('getGasFeeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const gasFeeControllerInitMessenger =
      getGasFeeControllerInitMessenger(messenger);

    expect(gasFeeControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the network controller actions used to read the global chain ID', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getGasFeeControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'NetworkController:getState',
          'NetworkController:getNetworkClientById',
        ]),
      }),
    );
  });
});
