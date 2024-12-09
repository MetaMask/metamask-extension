import { createProjectLogger } from '@metamask/utils';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
} from '@metamask/base-controller';
import {
  BaseRestrictedControllerMessenger,
  ControllerInit,
  ControllerInitRequest,
  ControllerName,
} from './types';

const log = createProjectLogger('controller-init');

type Controller = { name: string };

type BaseInitRequest = ControllerInitRequest<
  BaseRestrictedControllerMessenger,
  BaseRestrictedControllerMessenger
>;

type InitFunction = (request: BaseInitRequest) => { name: string };

type InitInstance = ControllerInit<
  Controller,
  BaseRestrictedControllerMessenger,
  BaseRestrictedControllerMessenger
>;

type InitObject = InitFunction | InitInstance;

class LegacyControllerInit extends ControllerInit<
  Controller,
  BaseRestrictedControllerMessenger,
  BaseRestrictedControllerMessenger
> {
  #fn: InitFunction;

  constructor(fn: InitFunction) {
    super();
    this.#fn = fn;
  }

  init(_request: BaseInitRequest): Controller {
    return this.#fn(_request);
  }
}

export function initControllers({
  controllerMessenger: controllerMessengerBase,
  initObjects,
  initRequest,
}: {
  controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
  initObjects: InitObject[];
  initRequest: Omit<
    BaseInitRequest,
    'getController' | 'controllerMessenger' | 'initMessenger'
  >;
}) {
  log('Initializing controllers', initObjects.length);

  const initInstances = initObjects.map((initObject) =>
    initObject instanceof ControllerInit
      ? initObject
      : new LegacyControllerInit(initObject),
  );

  const controllersByName: Record<string, Controller> = {};
  const controllerPersistedState: Record<string, unknown> = {};
  const controllerMemState: Record<string, unknown> = {};
  const controllerApi = {};

  const getController = <T>(name: ControllerName) =>
    getControllerOrThrow<T>(controllersByName, name);

  for (const initInstance of initInstances) {
    const messengerCallback = initInstance.getControllerMessengerCallback();
    const initCallback = initInstance.getInitMessengerCallback();
    const controllerMessenger = messengerCallback?.(controllerMessengerBase);
    const initMessenger = initCallback?.(controllerMessengerBase);

    const finalInitRequest: BaseInitRequest = {
      ...initRequest,
      controllerMessenger,
      getController,
      initMessenger,
    };

    const controller = initInstance.init(finalInitRequest);
    const { name } = controller;

    controllersByName[name] = controller;

    const getApiRequest = {
      controller,
      getFlatState: initRequest.getFlatState,
    };

    const api = initInstance.getApi(getApiRequest);

    Object.defineProperties(controllerApi, api);

    const persistedStateKey = initInstance.getPersistedStateKey?.(controller);
    const memStateKey = initInstance.getMemStateKey?.(controller);

    if (persistedStateKey) {
      controllerPersistedState[persistedStateKey] = controller;
    }

    if (memStateKey) {
      controllerMemState[memStateKey] = controller;
    }

    log('Initialized controller', name, {
      api: Object.keys(api),
      persistedStateKey,
      memStateKey,
    });
  }

  return {
    controllerApi,
    controllerMemState,
    controllerPersistedState,
    controllersByName,
  };
}

function getControllerOrThrow<T>(
  controllersByName: Record<ControllerName, Controller>,
  name: ControllerName,
): T {
  const controller = controllersByName[name];

  if (!controller) {
    throw new Error(`Controller requested before it was initialized: ${name}`);
  }

  return controller as T;
}
