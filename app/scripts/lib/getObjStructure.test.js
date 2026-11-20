import getObjStructure from './getObjStructure';

describe('getObjStructure', () => {
  it('should return type strings for primitive values', () => {
    const obj = {
      name: 'MetaMask',
      version: 10,
      active: true,
    };

    const result = getObjStructure(obj);

    expect(result).toStrictEqual({
      name: 'string',
      version: 'number',
      active: 'boolean',
    });
  });

  it('should handle null values', () => {
    const obj = {
      data: null,
      count: 5,
    };

    const result = getObjStructure(obj);

    expect(result).toStrictEqual({
      data: 'null',
      count: 'number',
    });
  });

  it('should handle undefined values', () => {
    const obj = {
      missing: undefined,
      present: 'hello',
    };

    const result = getObjStructure(obj);

    expect(result).toStrictEqual({
      missing: 'undefined',
      present: 'string',
    });
  });

  it('should recursively map nested objects', () => {
    const obj = {
      data: {
        CurrencyController: {
          currentCurrency: 'usd',
          conversionRate: 1800.5,
        },
      },
    };

    const result = getObjStructure(obj);

    expect(result).toStrictEqual({
      data: {
        CurrencyController: {
          currentCurrency: 'string',
          conversionRate: 'number',
        },
      },
    });
  });

  it('should handle deeply nested structures', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            value: 42,
          },
        },
      },
    };

    const result = getObjStructure(obj);

    expect(result).toStrictEqual({
      level1: {
        level2: {
          level3: {
            value: 'number',
          },
        },
      },
    });
  });

  it('should handle an empty object', () => {
    const result = getObjStructure({});
    expect(result).toStrictEqual({});
  });

  it('should handle arrays within objects', () => {
    const obj = {
      items: [1, 2, 3],
    };

    const result = getObjStructure(obj);

    expect(result).toStrictEqual({
      items: {
        0: 'number',
        1: 'number',
        2: 'number',
      },
    });
  });

  it('should not modify the original object', () => {
    const obj = {
      name: 'test',
      nested: { value: 123 },
    };

    getObjStructure(obj);

    expect(obj).toStrictEqual({
      name: 'test',
      nested: { value: 123 },
    });
  });

  it('should handle mixed types in nested structures', () => {
    const obj = {
      config: {
        enabled: true,
        label: 'network',
        chainId: 1,
        metadata: null,
      },
    };

    const result = getObjStructure(obj);

    expect(result).toStrictEqual({
      config: {
        enabled: 'boolean',
        label: 'string',
        chainId: 'number',
        metadata: 'null',
      },
    });
  });
});
