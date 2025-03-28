import { PPOMController } from '@metamask/ppom-validator';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from './test/utils';
import { ControllerApi, ControllerName } from './types';
import { initControllers } from './utils';

type InitFunctions = Parameters<typeof initControllers>[0]['initFunctions'];

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
  api?: Record<string, ControllerApi>;
  persistedStateKey?: string | null;
  memStateKey?: string | null;
} = {}) {
  return {
    controller: buildControllerMock(name),
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

function buildControllerMessenger() {
  return new Messenger();
}

describe('Controller Init Utils', () => {
  describe('initControllers', () => {
    it('returns controllers by name', () => {
      const requestMock = buildInitRequestMock();
      const init1Mock = buildControllerFunctionMock();
      const init2Mock = buildControllerFunctionMock();

      init2Mock.mockReturnValue(
        buildControllerInitResultMock({ name: CONTROLLER_NAME_2_MOCK }),
      );

      const { controllersByName } = initControllers({
        baseControllerMessenger: new Messenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: init1Mock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
        },
        initRequest: requestMock,
      });

      expect(controllersByName).toStrictEqual({
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

      initControllers({
        baseControllerMessenger: buildControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: init1Mock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
        },
        initRequest: requestMock,
      });

      expect(init1Mock).toHaveBeenCalledTimes(1);
      expect(init2Mock).toHaveBeenCalledTimes(1);
    });

    describe('provides getController method', () => {
      it('that returns initialized controller', () => {
        const requestMock = buildControllerInitRequestMock();
        const initMock = buildControllerFunctionMock();

        initControllers({
          baseControllerMessenger: buildControllerMessenger(),
          initFunctions: {
            [CONTROLLER_NAME_MOCK]: initMock,
          },
          initRequest: requestMock,
        });

        const { getController } = initMock.mock.calls[0][0];

        expect(
          getController(CONTROLLER_NAME_MOCK as ControllerName),
        ).toStrictEqual({ name: CONTROLLER_NAME_MOCK });
      });

      it('that throws if controller not found', () => {
        const requestMock = buildControllerInitRequestMock();
        const initMock = buildControllerFunctionMock();

        initControllers({
          baseControllerMessenger: buildControllerMessenger(),
          initFunctions: {
            [CONTROLLER_NAME_MOCK]: initMock,
          },
          initRequest: requestMock,
        });

        const { getController } = initMock.mock.calls[0][0];

        expect(() =>
          getController('InvalidController' as ControllerName),
        ).toThrow(
          'Controller requested before it was initialized: InvalidController',
        );
      });

      it('that returns existing controllers', () => {
        const requestMock = buildControllerInitRequestMock();
        const initMock = buildControllerFunctionMock();

        initControllers({
          baseControllerMessenger: buildControllerMessenger(),
          existingControllers: [buildControllerMock(CONTROLLER_NAME_2_MOCK)],
          initFunctions: {
            [CONTROLLER_NAME_MOCK]: initMock,
          },
          initRequest: requestMock,
        });

        const { getController } = initMock.mock.calls[0][0];

        expect(
          getController(CONTROLLER_NAME_2_MOCK as ControllerName),
        ).toStrictEqual({ name: CONTROLLER_NAME_2_MOCK });
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

      const { controllerApi } = initControllers({
        baseControllerMessenger: buildControllerMessenger(),
        initFunctions: {
          [CONTROLLER_NAME_MOCK]: initMock,
          [CONTROLLER_NAME_2_MOCK]: init2Mock,
        },
        initRequest: requestMock,
      });

      expect(controllerApi).toStrictEqual({
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

      const { controllerPersistedState } = initControllers({
        baseControllerMessenger: buildControllerMessenger(),
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

      const { controllerMemState } = initControllers({
        baseControllerMessenger: buildControllerMessenger(),
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

      initControllers({
        baseControllerMessenger: buildControllerMessenger(),
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

      initControllers({
        baseControllerMessenger: buildControllerMessenger(),
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

      initControllers({
        baseControllerMessenger: buildControllerMessenger(),
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

      initControllers({
        baseControllerMessenger: buildControllerMessenger(),
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
