import { ControllerMessenger } from '@metamask/base-controller';
import type {
  Transaction,
  CaipAssetType,
  InternalAccount,
} from '@metamask/keyring-api';
import {
  BtcAccountType,
  BtcMethod,
  EthAccountType,
  EthMethod,
} from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { v4 as uuidv4 } from 'uuid';
import {
  MultichainTransactionsController,
  AllowedActions,
  AllowedEvents,
  MultichainTransactionsControllerState,
  defaultState,
  MultichainTransactionsControllerMessenger,
} from './MultichainTransactionsController';
import { MultichainTransactionsTracker } from './MultichainTransactionsTracker';

const mockBtcAccount = {
  address: 'bc1qssdcp5kvwh6nghzg9tuk99xsflwkdv4hgvq58q',
  id: uuidv4(),
  metadata: {
    name: 'Bitcoin Account 1',
    importTime: Date.now(),
    keyring: {
      type: KeyringTypes.snap,
    },
    snap: {
      id: 'mock-btc-snap',
      name: 'mock-btc-snap',
      enabled: true,
    },
    lastSelected: 0,
  },
  options: {},
  methods: [BtcMethod.SendBitcoin],
  type: BtcAccountType.P2wpkh,
};

const mockEthAccount = {
  address: '0x807dE1cf8f39E83258904b2f7b473E5C506E4aC1',
  id: uuidv4(),
  metadata: {
    name: 'Ethereum Account 1',
    importTime: Date.now(),
    keyring: {
      type: KeyringTypes.snap,
    },
    snap: {
      id: 'mock-eth-snap',
      name: 'mock-eth-snap',
      enabled: true,
    },
    lastSelected: 0,
  },
  options: {},
  methods: [EthMethod.SignTypedDataV4, EthMethod.SignTransaction],
  type: EthAccountType.Eoa,
};

const mockTransactionResult = {
  data: [
    {
      id: '123',
      account: mockBtcAccount.id,
      chain: 'bip122:000000000933ea01ad0ee984209779ba',
      type: 'send',
      status: 'confirmed',
      timestamp: Date.now(),
      from: [],
      to: [],
      fees: [],
      events: [
        {
          status: 'confirmed',
          timestamp: Date.now(),
        },
      ],
    },
  ],
  next: null,
};

const setupController = ({
  state = defaultState,
  mocks,
}: {
  state?: MultichainTransactionsControllerState;
  mocks?: {
    listMultichainAccounts?: InternalAccount[];
    handleRequestReturnValue?: Record<CaipAssetType, Transaction>;
  };
} = {}) => {
  const controllerMessenger = new ControllerMessenger<
    AllowedActions,
    AllowedEvents
  >();

  const multichainTransactionsControllerMessenger: MultichainTransactionsControllerMessenger =
    controllerMessenger.getRestricted({
      name: 'MultichainTransactionsController',
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
      mocks?.handleRequestReturnValue ?? mockTransactionResult,
    ),
  );

  const mockListMultichainAccounts = jest.fn();
  controllerMessenger.registerActionHandler(
    'AccountsController:listMultichainAccounts',
    mockListMultichainAccounts.mockReturnValue(
      mocks?.listMultichainAccounts ?? [mockBtcAccount, mockEthAccount],
    ),
  );

  const controller = new MultichainTransactionsController({
    messenger: multichainTransactionsControllerMessenger,
    state,
  });

  return {
    controller,
    messenger: controllerMessenger,
    mockSnapHandleRequest,
    mockListMultichainAccounts,
  };
};

describe('MultichainTransactionsController', () => {
  it('initialize with default state', () => {
    const { controller } = setupController({});
    expect(controller.state).toEqual({ nonEvmTransactions: {} });
  });

  it('starts tracking when calling start', async () => {
    const spyTracker = jest.spyOn(
      MultichainTransactionsTracker.prototype,
      'start',
    );
    const { controller } = setupController();
    await controller.start();
    expect(spyTracker).toHaveBeenCalledTimes(1);
  });

  it('stops tracking when calling stop', async () => {
    const spyTracker = jest.spyOn(
      MultichainTransactionsTracker.prototype,
      'stop',
    );
    const { controller } = setupController();
    await controller.start();
    await controller.stop();
    expect(spyTracker).toHaveBeenCalledTimes(1);
  });

  it('update transactions when calling updateTransactions', async () => {
    const { controller } = setupController();

    await controller.updateTransactions();

    expect(controller.state).toEqual({
      nonEvmTransactions: {
        [mockBtcAccount.id]: {
          data: mockTransactionResult.data,
          next: null,
          lastUpdated: expect.any(Number),
        },
      },
    });
  });

  it('update transactions when "AccountsController:accountAdded" is fired', async () => {
    const { controller, messenger, mockListMultichainAccounts } =
      setupController({
        mocks: {
          listMultichainAccounts: [],
        },
      });

    controller.start();
    mockListMultichainAccounts.mockReturnValue([mockBtcAccount]);
    messenger.publish('AccountsController:accountAdded', mockBtcAccount);
    await controller.updateTransactions();

    expect(controller.state).toEqual({
      nonEvmTransactions: {
        [mockBtcAccount.id]: {
          data: mockTransactionResult.data,
          next: null,
          lastUpdated: expect.any(Number),
        },
      },
    });
  });

  it('update transactions when "AccountsController:accountRemoved" is fired', async () => {
    const { controller, messenger, mockListMultichainAccounts } =
      setupController();

    controller.start();
    await controller.updateTransactions();
    expect(controller.state).toEqual({
      nonEvmTransactions: {
        [mockBtcAccount.id]: {
          data: mockTransactionResult.data,
          next: null,
          lastUpdated: expect.any(Number),
        },
      },
    });

    messenger.publish('AccountsController:accountRemoved', mockBtcAccount.id);
    mockListMultichainAccounts.mockReturnValue([]);
    await controller.updateTransactions();

    expect(controller.state).toEqual({
      nonEvmTransactions: {},
    });
  });

  it('does not track balances for EVM accounts', async () => {
    const { controller, messenger, mockListMultichainAccounts } =
      setupController({
        mocks: {
          listMultichainAccounts: [],
        },
      });

    controller.start();
    mockListMultichainAccounts.mockReturnValue([mockEthAccount]);
    messenger.publish('AccountsController:accountAdded', mockEthAccount);
    await controller.updateTransactions();

    expect(controller.state).toStrictEqual({
      nonEvmTransactions: {},
    });
  });

  it('should update transactions for a specific account', async () => {
    const { controller } = setupController();
    await controller.updateTransactionsForAccount(mockBtcAccount.id);

    expect(controller.state.nonEvmTransactions[mockBtcAccount.id]).toEqual({
      data: mockTransactionResult.data,
      next: null,
      lastUpdated: expect.any(Number),
    });
  });

  it('should handle pagination when fetching transactions', async () => {
    const firstPage = {
      data: [
        {
          id: '1',
          account: mockBtcAccount.id,
          chain: 'bip122:000000000933ea01ad0ee984209779ba',
          type: 'send' as const,
          status: 'confirmed' as const,
          timestamp: Date.now(),
          from: [],
          to: [],
          fees: [],
          events: [
            {
              status: 'confirmed' as const,
              timestamp: Date.now(),
            },
          ],
        },
      ],
      next: 'page2',
    };

    const secondPage = {
      data: [
        {
          id: '2',
          account: mockBtcAccount.id,
          chain: 'bip122:000000000933ea01ad0ee984209779ba',
          type: 'send' as const,
          status: 'confirmed' as const,
          timestamp: Date.now(),
          from: [],
          to: [],
          fees: [],
          events: [
            {
              status: 'confirmed' as const,
              timestamp: Date.now(),
            },
          ],
        },
      ],
      next: null,
    };

    const { controller, mockSnapHandleRequest } = setupController();
    mockSnapHandleRequest
      .mockReturnValueOnce(firstPage)
      .mockReturnValueOnce(secondPage);

    await controller.updateTransactionsForAccount(mockBtcAccount.id);

    expect(mockSnapHandleRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: 'keyring_listAccountTransactions',
        }),
      }),
    );
  });

  it('should handle errors gracefully when updating transactions', async () => {
    const { controller, mockSnapHandleRequest } = setupController();
    mockSnapHandleRequest.mockRejectedValue(new Error('Failed to fetch'));

    await expect(controller.updateTransactions()).resolves.not.toThrow();
    expect(controller.state.nonEvmTransactions).toEqual({});
  });
});
