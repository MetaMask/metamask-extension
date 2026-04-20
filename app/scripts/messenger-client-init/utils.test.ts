import { PPOMController } from '@metamask/ppom-validator';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { MessengerClientApi, MessengerClientName } from './types';
import { initMessengerClients } from './utils';

type InitFunctions = Parameters<
  typeof initMessengerClients
>[0]['initFunctions'];

const CONTROLLER_NAME_MOCK = 'PPOMController';
const CONTROLLER_NAME_2_MOCK = 'TransactionController';

function buildControllerMock(name?: string) {
  return { name: name ?? CONTROLLER_NAME_MOCK } as unknown as PPOMController;
}

function buildControllerInitResultMock({
  name,
  api,
  persistedStateKey,
  memStateKey,
}: {
  name?: string;
  api?: Record<string, MessengerClientApi>;
  persistedStateKey?: string | null;
  memStateKey?: string | null;
} = {}) {
  return {
    messengerClient: buildControllerMock(name),
    api,
    persistedStateKey,
    memStateKey,
  };
}

function buildControllerFunctionMock() {
  return jest.fn().mockReturnValue(buildControllerInitResultMock());
}

function buildInitRequestMock() {
  return buildControllerInitRequestMock();
}

function buildBaseControllerMessenger() {
  return new Messenger<MockAnyNamespace, never, never>({
    namespace: MOCK_ANY_NAMESPACE,
  });
}

describe('Messenger Client Init Utils', () => {
  describe('initMessengerClients', () => {
    it('returns messenger clients by name', () => {
      const requestMock = buildInitRequestMock();
      const init1Mock = buildControllerFunctionMock();
      const init2Mock = buildControllerFunctionMock();

      init2Mock.mockReturnValue(
        buildControllerInitResultMock({ name: CONTROLLER_NAME_2_MOCK }),
      );

      const { messengerClientsByName } = initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: init1Mock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
        },
        initRequest: requestMock,
      });

      expect(messengerClientsByName).toStrictEqual({
        [CONTROLLER_NAME_MOCK]: { name: CONTROLLER_NAME_MOCK },
        [CONTROLLER_NAME_2_MOCK]: { name: CONTROLLER_NAME_2_MOCK },
      });
    });

    it('invokes with request', () => {
      const requestMock = buildControllerInitRequestMock();
      const init1Mock = buildControllerFunctionMock();
      const init2Mock = buildControllerFunctionMock();

      init2Mock.mockReturnValue(
        buildControllerInitResultMock({ name: CONTROLLER_NAME_2_MOCK }),
      );

      initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: init1Mock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
        },
        initRequest: requestMock,
      });

      expect(init1Mock).toHaveBeenCalledTimes(1);
      expect(init2Mock).toHaveBeenCalledTimes(1);
    });

    describe('provides getMessengerClient method', () => {
      it('that returns initialized controller', () => {
        const requestMock = buildControllerInitRequestMock();
        const initMock = buildControllerFunctionMock();

        initMessengerClients({
          baseControllerMessenger: buildBaseControllerMessenger(),
          initFunctions: {
            [CONTROLLER_NAME_MOCK]: initMock,
          },
          initRequest: requestMock,
        });

        const { getMessengerClient } = initMock.mock.calls[0][0];

        expect(
          getMessengerClient(CONTROLLER_NAME_MOCK as MessengerClientName),
        ).toStrictEqual({ name: CONTROLLER_NAME_MOCK });
      });

      it('that throws if messenger client not found', () => {
        const requestMock = buildControllerInitRequestMock();
        const initMock = buildControllerFunctionMock();

        initMessengerClients({
          baseControllerMessenger: buildBaseControllerMessenger(),
          initFunctions: {
            [CONTROLLER_NAME_MOCK]: initMock,
          },
          initRequest: requestMock,
        });

        const { getMessengerClient } = initMock.mock.calls[0][0];

        expect(() =>
          getMessengerClient('InvalidController' as MessengerClientName),
        ).toThrow(
          'Messenger client requested before it was initialized: InvalidController',
        );
      });
    });

    it('returns all API methods', () => {
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerFunctionMock();
      const init2Mock = buildControllerFunctionMock();

      initMock.mockReturnValue(
        buildControllerInitResultMock({
          api: { test1: jest.fn(), test2: jest.fn() },
        }),
      );

      init2Mock.mockReturnValue(
        buildControllerInitResultMock({ api: { test3: jest.fn() } }),
      );

      const { messengerClientApi } = initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: initMock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
        },
        initRequest: requestMock,
      });

      expect(messengerClientApi).toStrictEqual({
        test1: expect.any(Function),
        test2: expect.any(Function),
        test3: expect.any(Function),
      });
    });

    it('returns all persisted state entries', () => {
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerFunctionMock();
      const init2Mock = buildControllerFunctionMock();
      const init3Mock = buildControllerFunctionMock();

      initMock.mockReturnValue(
        buildControllerInitResultMock({ persistedStateKey: 'test1' }),
      );

      init2Mock.mockReturnValue(
        buildControllerInitResultMock({
          name: CONTROLLER_NAME_2_MOCK,
          persistedStateKey: null,
        }),
      );

      init3Mock.mockReturnValue(
        buildControllerInitResultMock({
          name: 'TestController3',
          persistedStateKey: 'test3',
        }),
      );

      const { controllerPersistedState } = initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: initMock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
          TestController3: init3Mock,
        } as InitFunctions,
        initRequest: requestMock,
      });

      expect(controllerPersistedState).toStrictEqual({
        test1: { name: CONTROLLER_NAME_MOCK },
        test3: { name: 'TestController3' },
      });
    });

    it('returns all memory state entries', () => {
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerFunctionMock();
      const init2Mock = buildControllerFunctionMock();
      const init3Mock = buildControllerFunctionMock();

      initMock.mockReturnValue(
        buildControllerInitResultMock({ memStateKey: 'test1' }),
      );

      init2Mock.mockReturnValue(
        buildControllerInitResultMock({
          name: CONTROLLER_NAME_2_MOCK,
          memStateKey: null,
        }),
      );

      init3Mock.mockReturnValue(
        buildControllerInitResultMock({
          name: 'TestController3',
          memStateKey: 'test3',
        }),
      );

      const { controllerMemState } = initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: initMock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
          TestController3: init3Mock,
        } as InitFunctions,
        initRequest: requestMock,
      });

      expect(controllerMemState).toStrictEqual({
        test1: { name: CONTROLLER_NAME_MOCK },
        test3: { name: 'TestController3' },
      });
    });

    it('provides controller messenger using callback', () => {
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerFunctionMock();

      initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: initMock,
        },
        initRequest: requestMock,
      });

      const { controllerMessenger } = initMock.mock.calls[0][0];

      expect(controllerMessenger).toBeDefined();
    });

    it('provides no controller messenger if no callback', () => {
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerFunctionMock();

      initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          TestName: initMock,
        } as InitFunctions,
        initRequest: requestMock,
      });

      const { controllerMessenger } = initMock.mock.calls[0][0];

      expect(controllerMessenger).toBeUndefined();
    });

    it('provides initialization messenger using callback', () => {
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerFunctionMock();

      initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: initMock,
        },
        initRequest: requestMock,
      });

      const { initMessenger } = initMock.mock.calls[0][0];

      expect(initMessenger).toBeDefined();
    });

    it('provides no initialization messenger if no callback', () => {
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerFunctionMock();

      initMessengerClients({
        baseControllerMessenger: buildBaseControllerMessenger(),
        initFunctions: {
          TestName: initMock,
        } as InitFunctions,
        initRequest: requestMock,
      });

      const { initMessenger } = initMock.mock.calls[0][0];

      expect(initMessenger).toBeUndefined();
    });
  });
});
