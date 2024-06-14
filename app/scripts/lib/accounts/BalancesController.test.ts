import { ControllerMessenger } from '@metamask/base-controller';
import {
  Balance,
  BtcAccountType,
  CaipAssetType,
  InternalAccount,
} from '@metamask/keyring-api';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import {
  BalancesController,
  AllowedActions,
  BalancesControllerEvents,
  BalancesControllerState,
  defaultState,
} from './BalancesController';

const mockBtcAccount = createMockInternalAccount({
  address: '',
  name: 'Btc Account',
  // @ts-expect-error - account type may be btc or eth, mock file is not typed
  type: BtcAccountType.P2wpkh,
  snapOptions: {
    id: 'mock-btc-snap',
    name: 'mock-btc-snap',
    enabled: true,
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
    BalancesControllerEvents
  >();

  const balancesControllerMessenger = controllerMessenger.getRestricted({
    name: 'BalancesController',
    allowedActions: [
      'SnapController:handleRequest',
      'AccountsController:listAccounts',
    ],
    allowedEvents: [],
  });

  const mockSnapHandleRequest = jest.fn();
  controllerMessenger.registerActionHandler(
    'SnapController:handleRequest',
    mockSnapHandleRequest.mockReturnValue(
      mocks?.handleRequestReturnValue ?? mockBalanceResult,
    ),
  );

  // TODO: remove when listMultichainAccounts action is available
  const mockListMultichainAccounts = jest
    .fn()
    .mockReturnValue(mocks?.listMultichainAccounts ?? [mockBtcAccount]);

  controllerMessenger.registerActionHandler(
    'AccountsController:listAccounts',
    mockListMultichainAccounts,
  );

  const controller = new BalancesController({
    messenger: balancesControllerMessenger,
    state,
    // TODO: remove when listMultichainAccounts action is available
    listMultichainAccounts: mockListMultichainAccounts,
  });

  return {
    controller,
    mockSnapHandleRequest,
    mockListMultichainAccounts,
  };
};

describe('BalancesController', () => {
  it('should initialize with default state', () => {
    const { controller } = setupController({});
    expect(controller.state).toEqual({ balances: {} });
  });

  it('should update balances when calling updateBalances', async () => {
    const { controller } = setupController();

    await controller.updateBalances();

    expect(controller.state).toEqual({
      balances: {
        [mockBtcAccount.id]: {
          'bip122:000000000933ea01ad0ee984209779ba/slip44:0': {
            amount: '0.00000000',
            unit: 'BTC',
          },
        },
      },
    });
  });
});
