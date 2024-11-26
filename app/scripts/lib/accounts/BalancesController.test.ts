import { ControllerMessenger } from '@metamask/base-controller';
import {
  Balance,
  BtcAccountType,
  CaipAssetType,
  InternalAccount,
} from '@metamask/keyring-api';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  BalancesController,
  AllowedActions,
  AllowedEvents,
  BalancesControllerState,
  defaultState,
  BalancesControllerMessenger,
} from './BalancesController';
import { BalancesTracker } from './BalancesTracker';

const mockBtcAccount = createMockInternalAccount({
  address: '',
  name: 'Btc Account',
  type: BtcAccountType.P2wpkh,
  snapOptions: {
    id: 'mock-btc-snap',
    name: 'mock-btc-snap',
    enabled: true,
  },
  options: {
    scope: MultichainNetworks.BITCOIN_TESTNET,
  },
});

const mockBalanceResult = {
  'bip122:000000000933ea01ad0ee984209779ba/slip44:0': {
    amount: '0.00000000',
    unit: 'BTC',
  },
};

const setupController = ({
  state = defaultState,
  mocks,
}: {
  state?: BalancesControllerState;
  mocks?: {
    listMultichainAccounts?: InternalAccount[];
    handleRequestReturnValue?: Record<CaipAssetType, Balance>;
  };
} = {}) => {
  const controllerMessenger = new ControllerMessenger<
    AllowedActions,
    AllowedEvents
  >();

  const balancesControllerMessenger: BalancesControllerMessenger =
    controllerMessenger.getRestricted({
      name: 'BalancesController',
      allowedActions: [
        'SnapController:handleRequest',
        'AccountsController:listMultichainAccounts',
      ],
      allowedEvents: [
        'AccountsController:accountAdded',
        'AccountsController:accountRemoved',
      ],
    });

  const mockSnapHandleRequest = jest.fn();
  controllerMessenger.registerActionHandler(
    'SnapController:handleRequest',
    mockSnapHandleRequest.mockReturnValue(
      mocks?.handleRequestReturnValue ?? mockBalanceResult,
    ),
  );

  const mockListMultichainAccounts = jest.fn();
  controllerMessenger.registerActionHandler(
    'AccountsController:listMultichainAccounts',
    mockListMultichainAccounts.mockReturnValue(
      mocks?.listMultichainAccounts ?? [mockBtcAccount],
    ),
  );

  const controller = new BalancesController({
    messenger: balancesControllerMessenger,
    state,
  });

  return {
    controller,
    messenger: controllerMessenger,
    mockSnapHandleRequest,
    mockListMultichainAccounts,
  };
};

describe('BalancesController', () => {
  it('initialize with default state', () => {
    const { controller } = setupController({});
    expect(controller.state).toEqual({ balances: {} });
  });

  it('starts tracking when calling start', async () => {
    const spyTracker = jest.spyOn(BalancesTracker.prototype, 'start');
    const { controller } = setupController();
    await controller.start();
    expect(spyTracker).toHaveBeenCalledTimes(1);
  });

  it('stops tracking when calling stop', async () => {
    const spyTracker = jest.spyOn(BalancesTracker.prototype, 'stop');
    const { controller } = setupController();
    await controller.start();
    await controller.stop();
    expect(spyTracker).toHaveBeenCalledTimes(1);
  });

  it('update balances when calling updateBalances', async () => {
    const { controller } = setupController();

    await controller.updateBalances();

    expect(controller.state).toEqual({
      balances: {
        [mockBtcAccount.id]: mockBalanceResult,
      },
    });
  });

  it('update balances when "AccountsController:accountAdded" is fired', async () => {
    const { controller, messenger, mockListMultichainAccounts } =
      setupController({
        mocks: {
          listMultichainAccounts: [],
        },
      });

    controller.start();
    mockListMultichainAccounts.mockReturnValue([mockBtcAccount]);
    messenger.publish('AccountsController:accountAdded', mockBtcAccount);
    await controller.updateBalances();

    expect(controller.state).toEqual({
      balances: {
        [mockBtcAccount.id]: mockBalanceResult,
      },
    });
  });

  it('update balances when "AccountsController:accountRemoved" is fired', async () => {
    const { controller, messenger, mockListMultichainAccounts } =
      setupController();

    controller.start();
    await controller.updateBalances();
    expect(controller.state).toEqual({
      balances: {
        [mockBtcAccount.id]: mockBalanceResult,
      },
    });

    messenger.publish('AccountsController:accountRemoved', mockBtcAccount.id);
    mockListMultichainAccounts.mockReturnValue([]);
    await controller.updateBalances();

    expect(controller.state).toEqual({
      balances: {},
    });
  });
});
