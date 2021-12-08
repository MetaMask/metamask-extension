import { nodeify, nodeifyObject } from './nodeify';

describe('nodeify', () => {
  const getObject = () => {
    return {
      foo: 'bar',
      promiseFunc(a) {
        const solution = this.foo + a;
        return Promise.resolve(solution);
      },
    };
  };

  it('should retain original context', () => {
    const obj = getObject();
    const nodified = nodeify(obj.promiseFunc, obj);
    nodified('baz', (_, res) => {
      expect(res).toStrictEqual('barbaz');
    });
  });

  it('no callback - should allow the last argument to not be a function', async () => {
    const obj = getObject();
    const nodified = nodeify(obj.promiseFunc, obj);
    await expect(() => {
      nodified('baz');
    }).not.toThrow();
  });

  it('sync functions - returns value', async () => {
    const nodified = nodeify(() => 42);
    nodified((_, result) => {
      expect(42).toStrictEqual(result);
    });
  });

  it('sync functions - handles errors', () => {
    const nodified = nodeify(() => {
      throw new Error('boom!');
    });
    nodified((err, _) => {
      expect(err.message).toStrictEqual('boom!');
    });
  });

  describe('nodeifyObject', () => {
    it('nodeifies every function of an object', async () => {
      const obj = {
        notFunction: 'bar',
        syncFunction: () => 'hello',
        asyncFunction: async () => 'goodbye',
      };

      const nodeified = nodeifyObject(obj, null);
      expect(nodeified.notFunction).toStrictEqual(obj.notFunction);

      await Promise.all([
        new Promise((resolve, reject) => {
          nodeified.syncFunction((err, result) => {
            if (err) {
              reject(
                new Error(`should not have thrown any error: ${err.message}`),
              );
              return;
            }
            expect(result).toStrictEqual('hello');
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          nodeified.asyncFunction((err, result) => {
            if (err) {
              reject(
                new Error(`should not have thrown any error: ${err.message}`),
              );
              return;
            }
            expect(result).toStrictEqual('goodbye');
            resolve();
          });
        }),
      ]);
    });
  });
});
