export const createMockImplementation = <T,>(request: string, response: T) => {
  return (method: string): Promise<T | undefined> => {
    if (method === request) {
      return Promise.resolve(response);
    }
    return Promise.resolve(undefined);
  };
};
