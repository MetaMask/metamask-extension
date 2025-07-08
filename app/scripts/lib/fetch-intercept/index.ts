type Interceptor = {
  request?: (
    ...args: Parameters<typeof fetch>
  ) => Parameters<typeof fetch> | Promise<Parameters<typeof fetch>>;
  requestError?: (error: unknown) => void | Promise<void>;
  response?: (response: Response) => Response | Promise<Response>;
  responseError?: (error: unknown) => void | Promise<void>;
};

type FetchWithAuthAPI = {
  register: (interceptor: Interceptor) => () => void;
  clear: () => void;
};

function attach(): FetchWithAuthAPI {
  const interceptors: Interceptor[] = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = function (...args: Parameters<typeof fetch>) {
    return interceptor(originalFetch, interceptors, ...args);
  };

  return {
    register(newInterceptor: Interceptor) {
      interceptors.push(newInterceptor);
      return () => {
        const index = interceptors.indexOf(newInterceptor);
        if (index >= 0) {
          interceptors.splice(index, 1);
        }
      };
    },
    clear() {
      interceptors.length = 0;
    },
  };
}

async function interceptor(
  originalFetch: typeof fetch,
  interceptors: Interceptor[],
  ...args: Parameters<typeof fetch>
): Promise<Response> {
  const reversedInterceptors = interceptors.toReversed();

  let currentArgs: Parameters<typeof fetch> = args;

  for (const { request, requestError } of reversedInterceptors) {
    if (request || requestError) {
      try {
        if (request) {
          const result = await request(...currentArgs);
          currentArgs = result || currentArgs;
        }
      } catch (error) {
        if (requestError) {
          await requestError(error);
        } else {
          throw error;
        }
      }
    }
  }

  const request = new Request(...currentArgs);
  let response: Response;

  try {
    response = await originalFetch(request);
    Object.defineProperty(response, 'request', {
      value: request,
      writable: false,
      enumerable: false,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      (error as Error & { request?: Request }).request = request;
    }
    throw error;
  }

  for (const {
    response: responseInterceptor,
    responseError,
  } of reversedInterceptors) {
    if (responseInterceptor || responseError) {
      try {
        if (responseInterceptor) {
          response = await responseInterceptor(response);
        }
      } catch (error) {
        if (responseError) {
          await responseError(error);
        } else {
          throw error;
        }
      }
    }
  }

  return response;
}

export const fetchIntercept = attach();
