import { PPOMController } from '@metamask/ppom-validator';
import { Controller } from './controller-list';
import {
  buildControllerInitRequestMock,
  buildControllerMessengerMock,
} from './test/utils';
import {
  BaseRestrictedControllerMessenger,
  ControllerInit,
  ControllerName,
} from './types';
import { initControllers } from './utils';

const CONTROLLER_NAME_MOCK = 'TestController1';
const CONTROLLER_NAME_2_MOCK = 'TestController2';

function buildControllerMock(name: string) {
  return { name } as unknown as PPOMController;
}

function buildControllerInitMock() {
  return {
    init: jest.fn().mockReturnValue({ name: CONTROLLER_NAME_MOCK }),
    getApi: jest.fn().mockReturnValue({}),
    getControllerMessengerCallback: jest.fn(),
    getInitMessengerCallback: jest.fn(),
    getPersistedStateKey: jest.fn(),
    getMemStateKey: jest.fn(),
  } as unknown as jest.Mocked<
    ControllerInit<
      Controller,
      BaseRestrictedControllerMessenger,
      BaseRestrictedControllerMessenger
    >
  >;
}

describe('Controller Init Utils', () => {
  describe('initControllers', () => {
    it('returns controllers by name', () => {
      const controllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const init1Mock = buildControllerInitMock();
      const init2Mock = buildControllerInitMock();

      init2Mock.init.mockReturnValue(
        buildControllerMock(CONTROLLER_NAME_2_MOCK),
      );

      const { controllersByName } = initControllers({
        initObjects: [init1Mock, init2Mock],
        baseControllerMessenger: controllerMessengerMock,
        initRequest: requestMock,
      });

      expect(controllersByName).toStrictEqual({
        [CONTROLLER_NAME_MOCK]: { name: CONTROLLER_NAME_MOCK },
        [CONTROLLER_NAME_2_MOCK]: { name: CONTROLLER_NAME_2_MOCK },
      });
    });

    it('invokes init with request', () => {
      const controllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const init1Mock = buildControllerInitMock();
      const init2Mock = buildControllerInitMock();

      init2Mock.init.mockReturnValue(
        buildControllerMock(CONTROLLER_NAME_2_MOCK),
      );

      initControllers({
        initObjects: [init1Mock, init2Mock],
        baseControllerMessenger: controllerMessengerMock,
        initRequest: requestMock,
      });

      expect(init1Mock.init).toHaveBeenCalledTimes(1);
      expect(init2Mock.init).toHaveBeenCalledTimes(1);
    });

    describe('provides getController method', () => {
      it('that returns controller', () => {
        const controllerMessengerMock = buildControllerMessengerMock();
        const requestMock = buildControllerInitRequestMock();
        const initMock = buildControllerInitMock();

        initControllers({
          initObjects: [initMock],
          baseControllerMessenger: controllerMessengerMock,
          initRequest: requestMock,
        });

        const { getController } = initMock.init.mock.calls[0][0];

        expect(
          getController(CONTROLLER_NAME_MOCK as ControllerName),
        ).toStrictEqual({ name: CONTROLLER_NAME_MOCK });
      });

      it('that throws if controller not found', () => {
        const controllerMessengerMock = buildControllerMessengerMock();
        const requestMock = buildControllerInitRequestMock();
        const initMock = buildControllerInitMock();

        initControllers({
          initObjects: [initMock],
          baseControllerMessenger: controllerMessengerMock,
          initRequest: requestMock,
        });

        const { getController } = initMock.init.mock.calls[0][0];

        expect(() =>
          getController('InvalidController' as ControllerName),
        ).toThrow(
          'Controller requested before it was initialized: InvalidController',
        );
      });
    });

    it('provides controller messenger using callback', () => {
      const baseControllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();

      const restrictedControllerMessengerMock =
        buildControllerMessengerMock() as unknown as BaseRestrictedControllerMessenger;

      const getControllerMessengerCallback = jest
        .fn()
        .mockReturnValue(restrictedControllerMessengerMock);

      initMock.getControllerMessengerCallback.mockReturnValue(
        getControllerMessengerCallback,
      );

      initControllers({
        initObjects: [initMock],
        baseControllerMessenger: baseControllerMessengerMock,
        initRequest: requestMock,
      });

      const { controllerMessenger } = initMock.init.mock.calls[0][0];

      expect(controllerMessenger).toStrictEqual(
        restrictedControllerMessengerMock,
      );
      expect(getControllerMessengerCallback).toHaveBeenCalledWith(
        baseControllerMessengerMock,
      );
    });

    it('provides no controller messenger if no callback', () => {
      const baseControllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();

      initControllers({
        initObjects: [initMock],
        baseControllerMessenger: baseControllerMessengerMock,
        initRequest: requestMock,
      });

      const { controllerMessenger } = initMock.init.mock.calls[0][0];

      expect(controllerMessenger).toBeUndefined();
    });

    it('provides initialization messenger using callback', () => {
      const baseControllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();

      const restrictedControllerMessengerMock =
        buildControllerMessengerMock() as unknown as BaseRestrictedControllerMessenger;

      const getInitMessengerCallback = jest
        .fn()
        .mockReturnValue(restrictedControllerMessengerMock);

      initMock.getInitMessengerCallback.mockReturnValue(
        getInitMessengerCallback,
      );

      initControllers({
        initObjects: [initMock],
        baseControllerMessenger: baseControllerMessengerMock,
        initRequest: requestMock,
      });

      const { initMessenger } = initMock.init.mock.calls[0][0];

      expect(initMessenger).toStrictEqual(restrictedControllerMessengerMock);
      expect(getInitMessengerCallback).toHaveBeenCalledWith(
        baseControllerMessengerMock,
      );
    });

    it('provides no initialization messenger if no callback', () => {
      const baseControllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();

      initControllers({
        initObjects: [initMock],
        baseControllerMessenger: baseControllerMessengerMock,
        initRequest: requestMock,
      });

      const { initMessenger } = initMock.init.mock.calls[0][0];

      expect(initMessenger).toBeUndefined();
    });

    it('returns all API methods', () => {
      const controllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();
      const init2Mock = buildControllerInitMock();

      initMock.getApi.mockReturnValue({ test1: jest.fn(), test2: jest.fn() });
      init2Mock.getApi.mockReturnValue({ test3: jest.fn() });

      const { controllerApi } = initControllers({
        initObjects: [initMock, init2Mock],
        baseControllerMessenger: controllerMessengerMock,
        initRequest: requestMock,
      });

      expect(controllerApi).toStrictEqual({
        test1: expect.any(Function),
        test2: expect.any(Function),
        test3: expect.any(Function),
      });
    });

    it('invokes getApi with request', () => {
      const controllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();

      initControllers({
        initObjects: [initMock],
        baseControllerMessenger: controllerMessengerMock,
        initRequest: requestMock,
      });

      expect(initMock.getApi).toHaveBeenCalledTimes(1);
      expect(initMock.getApi.mock.calls[0][0].controller).toStrictEqual({
        name: CONTROLLER_NAME_MOCK,
      });
    });

    it('returns all persisted state entries', () => {
      const controllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();
      const init2Mock = buildControllerInitMock();
      const init3Mock = buildControllerInitMock();

      initMock.getPersistedStateKey.mockReturnValue('test1');

      init2Mock.init.mockReturnValue(
        buildControllerMock(CONTROLLER_NAME_2_MOCK),
      );
      init2Mock.getPersistedStateKey.mockReturnValue(undefined);

      init3Mock.init.mockReturnValue(buildControllerMock('TestController3'));
      init3Mock.getPersistedStateKey.mockReturnValue('test3');

      const { controllerPersistedState } = initControllers({
        initObjects: [initMock, init2Mock, init3Mock],
        baseControllerMessenger: controllerMessengerMock,
        initRequest: requestMock,
      });

      expect(controllerPersistedState).toStrictEqual({
        test1: { name: CONTROLLER_NAME_MOCK },
        test3: { name: 'TestController3' },
      });
    });

    it('returns all memory state entries', () => {
      const controllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initMock = buildControllerInitMock();
      const init2Mock = buildControllerInitMock();
      const init3Mock = buildControllerInitMock();

      initMock.getMemStateKey.mockReturnValue('test1');

      init2Mock.init.mockReturnValue(
        buildControllerMock(CONTROLLER_NAME_2_MOCK),
      );
      init2Mock.getMemStateKey.mockReturnValue(undefined);

      init3Mock.init.mockReturnValue(buildControllerMock('TestController3'));
      init3Mock.getMemStateKey.mockReturnValue('test3');

      const { controllerMemState } = initControllers({
        initObjects: [initMock, init2Mock, init3Mock],
        baseControllerMessenger: controllerMessengerMock,
        initRequest: requestMock,
      });

      expect(controllerMemState).toStrictEqual({
        test1: { name: CONTROLLER_NAME_MOCK },
        test3: { name: 'TestController3' },
      });
    });

    it('supports legacy init functions', () => {
      const controllerMessengerMock = buildControllerMessengerMock();
      const requestMock = buildControllerInitRequestMock();
      const initFunctionMock = () => buildControllerMock(CONTROLLER_NAME_MOCK);
      const initFunction2Mock = () =>
        buildControllerMock(CONTROLLER_NAME_2_MOCK);

      const { controllersByName } = initControllers({
        initObjects: [initFunctionMock, initFunction2Mock],
        baseControllerMessenger: controllerMessengerMock,
        initRequest: requestMock,
      });

      expect(controllersByName).toStrictEqual({
        [CONTROLLER_NAME_MOCK]: { name: CONTROLLER_NAME_MOCK },
        [CONTROLLER_NAME_2_MOCK]: { name: CONTROLLER_NAME_2_MOCK },
      });
    });
  });
});
