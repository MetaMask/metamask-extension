import { createProjectLogger } from '@metamask/utils';
import { ControllerInit, ControllerInitRequest, ControllerName } from './types';
import { ActionConstraint, ControllerMessenger, EventConstraint } from '@metamask/base-controller';

const log = createProjectLogger('controller-init');

type Controller = { name: string };
type BaseInitRequest = ControllerInitRequest<unknown>;
type InitFunction = (request: BaseInitRequest) => { name: string };
type InitInstance = ControllerInit<Controller, unknown>;
type InitObject = InitFunction | InitInstance;

export function initControllers({
  controllerMessenger,
  initObjects,
  initRequest,
}: {
  controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;
  initObjects: InitObject[];
  initRequest: Omit<
    ControllerInitRequest<unknown>,
    'getController' | 'getMessenger'
  >;
}) {
  log('Initializing controllers', initObjects.length);

  const controllersByName: Record<string, Controller> = {};
  const controllerPersistedState: Record<string, unknown> = {};
  const controllerMemState: Record<string, unknown> = {};
  let controllerApi = {};

  for (const initObject of initObjects) {
    const initInstance = initObject as InitInstance;
    const initFunction = initObject as InitFunction;

    const finalInitRequest: BaseInitRequest = {
      ...initRequest,
      getController: (name: ControllerName) =>
        getController(controllersByName, name),
      getMessenger:
        () => initInstance.getMessengerCallback?.()?.(controllerMessenger),
    };

    const controller = Boolean(initInstance.init)
      ? initInstance.init(finalInitRequest)
      : initFunction(finalInitRequest);

    const { name } = controller;

    controllersByName[name] = controller;

    const getApiRequest = {
      controller,
      getFlatState: initRequest.getFlatState,
    };

    const api = initInstance.getApi?.(getApiRequest) ?? {};

    controllerApi = {
      ...controllerApi,
      ...api,
    };

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

function getController<T>(
  controllersByName: Record<ControllerName, Controller>,
  name: ControllerName,
): T {
  const controller = controllersByName[name];

  if (!controller) {
    throw new Error(`Controller requested before it was initialized: ${name}`);
  }

  return controller as T;
}
