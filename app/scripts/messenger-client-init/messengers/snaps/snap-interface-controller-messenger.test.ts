import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getSnapInterfaceControllerMessenger } from './snap-interface-controller-messenger';

describe('getSnapInterfaceControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const snapInterfaceControllerMessenger =
      getSnapInterfaceControllerMessenger(messenger);

    expect(snapInterfaceControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('serves MultichainAssetsController:getState from AssetsController state', () => {
    const messenger = getRootMessenger();
    const assetsMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });
    assetsMessenger.registerActionHandler(
      'AssetsController:getState' as never,
      () =>
        ({
          assetsBalance: {
            'sol-account': {
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
                amount: '1',
              },
            },
          },
          customAssets: {},
          assetsInfo: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              decimals: 9,
              image: 'https://example.com/sol.png',
              name: 'Solana',
              symbol: 'SOL',
              type: 'native',
            },
          },
        }) as never,
    );
    const accountsMessenger = new Messenger({
      namespace: 'AccountsController',
      parent: messenger,
    });
    accountsMessenger.registerActionHandler(
      'AccountsController:listMultichainAccounts' as never,
      () =>
        [
          {
            id: 'sol-account',
            type: 'solana:data-account',
            address: '11111111111111111111111111111111',
          },
        ] as never,
    );

    const snapInterfaceControllerMessenger =
      getSnapInterfaceControllerMessenger(messenger);

    expect(
      snapInterfaceControllerMessenger.call(
        'MultichainAssetsController:getState',
      ),
    ).toStrictEqual({
      accountsAssets: {
        'sol-account': ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501'],
      },
      assetsMetadata: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          fungible: true,
          iconUrl: 'https://example.com/sol.png',
          units: [{ decimals: 9, symbol: 'SOL', name: 'Solana' }],
          symbol: 'SOL',
          name: 'Solana',
        },
      },
    });
  });
});
