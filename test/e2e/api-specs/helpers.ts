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

        while (result === null) {
          // Continue polling if result is not set
          await driver.delay(500);
          result = await driver.executeScript(
            `return window['${generatedKey}'];`,
          );
        }

        // clear the result
        await driver.executeScript(`delete window['${generatedKey}'];`);

        return result;
      },
    });
  });
  if (result !== undefined) {
    return result;
  }
  return pollForResult(driver, generatedKey);
};

export const createDriverTransport = (driver: Driver) => {
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
      };
      return execute();
    }).then(async () => {
      const response = await pollForResult(driver, generatedKey);
      return response;
    });
  };
};
