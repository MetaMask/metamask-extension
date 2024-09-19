import { v4 as uuid } from 'uuid';
import { ErrorObject } from '@open-rpc/meta-schema';
import { JsonRpcResponse } from 'json-rpc-engine';
import { JsonRpcFailure } from '@metamask/utils';
import { Driver } from '../webdriver/driver';
import { ScopeString } from '../../../app/scripts/lib/multichain-api/scope';

// eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-explicit-any
declare let window: any;

type QueueItem = {
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  name: string;
};

export const taskQueue: QueueItem[] = [];
let isProcessing = false;

export const processQueue = async () => {
  if (isProcessing || taskQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const item = taskQueue.shift();
  if (!item) {
    return;
  }
  const { task, resolve, reject }: QueueItem | undefined = item;
  try {
    const result = await task();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    await processQueue();
  }
};

export const addToQueue = ({ task, resolve, reject, name }: QueueItem) => {
  taskQueue.push({ task, resolve, reject, name });
  return processQueue();
};

export const pollForResult = async (
  driver: Driver,
  generatedKey: string,
): Promise<unknown> => {
  let result;
  await new Promise((resolve, reject) => {
    addToQueue({
      name: 'pollResult',
      resolve,
      reject,
      task: async () => {
        result = await driver.executeScript(
          `return window['${generatedKey}'];`,
        );

        if (result !== undefined && result !== null) {
          // clear the result
          await driver.executeScript(`delete window['${generatedKey}'];`);
        } else {
          await driver.delay(500);
        }

        return result;
      },
    });
  });
  if (result !== undefined && result !== null) {
    return result;
  }
  return pollForResult(driver, generatedKey);
};

export const createCaip27DriverTransport = (
  driver: Driver,
  scopeMap: Record<string, ScopeString>,
) => {
  // use externally_connectable to communicate with the extension
  // https://developer.chrome.com/docs/extensions/mv3/messaging/
  return async (
    __: string,
    method: string,
    params: unknown[] | Record<string, unknown>,
  ) => {
    const generatedKey = uuid();
    addToQueue({
      name: 'transport',
      resolve: () => {
        // noop
      },
      reject: () => {
        // noop
      },
      task: async () => {
        // don't wait for executeScript to finish window.ethereum promise
        // we need this because if we wait for the promise to resolve it
        // will hang in selenium since it can only do one thing at a time.
        // the workaround is to put the response on window.asyncResult and poll for it.
        driver.executeScript(
          ([m, p, g, s]: [
            string,
            unknown[] | Record<string, unknown>,
            string,
            ScopeString,
          ]) => {
            const EXTENSION_ID = 'famgliladofnadeldnodcgnjhafnbnhj';
            const extensionPort = chrome.runtime.connect(EXTENSION_ID);

            const listener = ({
              type,
              data,
            }: {
              type: string;
              data: JsonRpcResponse<unknown>;
            }) => {
              if (type !== 'caip-x') {
                return;
              }
              if (data?.id !== g) {
                return;
              }

              if (data.id || (data as JsonRpcFailure).error) {
                window[g] = data;
                extensionPort.onMessage.removeListener(listener);
              }
            };

            extensionPort.onMessage.addListener(listener);
            const msg = {
              type: 'caip-x',
              data: {
                jsonrpc: '2.0',
                method: 'wallet_invokeMethod',
                params: {
                  request: {
                    method: m,
                    params: p,
                  },
                  scope: s,
                },
                id: g,
              },
            };
            extensionPort.postMessage(msg);
          },
          method,
          params,
          generatedKey,
          scopeMap[method],
        );
      },
    });
    return pollForResult(driver, generatedKey);
  };
};

export const createMultichainDriverTransport = (driver: Driver) => {
  // use externally_connectable to communicate with the extension
  // https://developer.chrome.com/docs/extensions/mv3/messaging/
  return async (
    __: string,
    method: string,
    params: unknown[] | Record<string, unknown>,
  ) => {
    const generatedKey = uuid();
    addToQueue({
      name: 'transport',
      resolve: () => {
        // noop
      },
      reject: () => {
        // noop
      },
      task: async () => {
        // don't wait for executeScript to finish window.ethereum promise
        // we need this because if we wait for the promise to resolve it
        // will hang in selenium since it can only do one thing at a time.
        // the workaround is to put the response on window.asyncResult and poll for it.
        driver.executeScript(
          ([m, p, g]: [
            string,
            unknown[] | Record<string, unknown>,
            string,
          ]) => {
            const EXTENSION_ID = 'famgliladofnadeldnodcgnjhafnbnhj';
            const extensionPort = chrome.runtime.connect(EXTENSION_ID);

            const listener = ({
              type,
              data,
            }: {
              type: string;
              data: JsonRpcResponse<unknown>;
            }) => {
              if (type !== 'caip-x') {
                return;
              }
              if (data?.id !== g) {
                return;
              }

              if (data.id || (data as JsonRpcFailure).error) {
                window[g] = data;
                extensionPort.onMessage.removeListener(listener);
              }
            };

            extensionPort.onMessage.addListener(listener);
            const msg = {
              type: 'caip-x',
              data: {
                jsonrpc: '2.0',
                method: m,
                params: p,
                id: g,
              },
            };
            extensionPort.postMessage(msg);
          },
          method,
          params,
          generatedKey,
        );
      },
    });
    return pollForResult(driver, generatedKey);
  };
};

export const createDriverTransport = (driver: Driver) => {
  return async (
    __: string,
    method: string,
    params: unknown[] | Record<string, unknown>,
  ) => {
    const generatedKey = uuid();
    addToQueue({
      name: 'transport',
      resolve: () => {
        // noop
      },
      reject: () => {
        // noop
      },
      task: async () => {
        // don't wait for executeScript to finish window.ethereum promise
        // we need this because if we wait for the promise to resolve it
        // will hang in selenium since it can only do one thing at a time.
        // the workaround is to put the response on window.asyncResult and poll for it.
        driver.executeScript(
          ([m, p, g]: [
            string,
            unknown[] | Record<string, unknown>,
            string,
          ]) => {
            window[g] = null;
            window.ethereum
              .request({ method: m, params: p })
              .then((r: unknown) => {
                window[g] = { result: r };
              })
              .catch((e: ErrorObject) => {
                window[g] = {
                  id: g,
                  error: {
                    code: e.code,
                    message: e.message,
                    data: e.data,
                  },
                };
              });
          },
          method,
          params,
          generatedKey,
        );
      },
    });
    return pollForResult(driver, generatedKey);
  };
};
