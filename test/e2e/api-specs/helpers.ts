
import { Driver } from '../webdriver/driver';
import { v4 as uuid } from "uuid";

declare let window: any;

export const pollForResult = async (driver: Driver, generatedKey: string) => {
  let result = await driver.executeScript(`return window['${generatedKey}'];`);

  while (result === null) {
    // Continue polling if result is not set
    await driver.delay(50);
    result = await driver.executeScript(`return window['${generatedKey}'];`);
  }

  // clear the result
  await driver.executeScript(`delete window['${generatedKey}'];`);

  return result;
};

export const createDriverTransport = (driver: Driver) => {
  return async (
    _: string,
    method: string,
    params: any[] | Record<string, any>,
  ) => {
    const generatedKey = uuid();
    // don't wait for executeScript to finish window.ethereum promise
    // we need this because if we wait for the promise to resolve it
    // will hang in selenium since it can only do one thing at a time.
    // the workaround is to put the response on window.asyncResult and poll for it.
    driver.executeScript(
      ([m, p, g]: any) => {
        window[g] = null;
        window.ethereum
          .request({ method: m, params: p })
          .then((r: any) => {
            window[g] = { result: r };
          })
          .catch((e: any) => {
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
    const response = await pollForResult(driver, generatedKey);
    return response;
  };
};
