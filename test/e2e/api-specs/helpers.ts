import { v4 as uuid } from 'uuid';
import { ErrorObject } from '@open-rpc/meta-schema';
import { Driver } from '../webdriver/driver';

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
  // eslint-disable-next-line no-loop-func
  await new Promise((resolve, reject) => {
    addToQueue({
      name: 'pollResult',
      resolve,
      reject,
      task: async () => {
        result = await driver.executeScript(
          `return window['${generatedKey}'];`,
        );

        if (result) {
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

export const createMulichainDriverTransport = (driver: Driver) => {
  // use externally_connectable to communicate with the extension
  // https://developer.chrome.com/docs/extensions/mv3/messaging/

  return async (
    _: string,
    method: string,
    params: unknown[] | Record<string, unknown>,
  ) => {
    const generatedKey = uuid();
    return new Promise((resolve, reject) => {
      const execute = async () => {
        await addToQueue({
          name: 'transport',
          resolve,
          reject,
          task: async () => {
            console.log('about to call executeScript');

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
                const EXTENSION_ID = 'famgliladofnadeldnodcgnjhafnbnhj';
                const extensionPort = chrome.runtime.connect(EXTENSION_ID);
                console.log('got poart');

                extensionPort.onMessage.addListener(({ type, data }: any) => {
                  console.log('got message', type, data);
                  if (type !== 'caip-x') {
                    return;
                  }
                  if (data.id || data.error) {
                    window[g] = data;
                  }
                });
                const msg = {
                  type: 'caip-x',
                  data: {
                    jsonrpc: '2.0',
                    method: m,
                    params: p,
                    id: g,
                  },
                };
                console.log('sending postmessage', msg);
                extensionPort.postMessage(msg);
              },
              method,
              params,
              generatedKey,
            );
          },
        });
      };
      return execute();
    }).then(async () => {
      const response = await pollForResult(driver, generatedKey);
      return response;
    });
  };
};

export const createDriverTransport = (driver: Driver) => {
  return async (
    _: string,
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
