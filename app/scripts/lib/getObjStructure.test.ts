import getObjStructure from './getObjStructure';

describe('getObjStructure', () => {
  it('replaces leaf values with their javascript types', () => {
    expect(
      getObjStructure({
        data: {
          count: 1,
          label: 'eth',
          enabled: true,
          missing: null,
        },
      }),
    ).toStrictEqual({
      data: {
        count: 'number',
        label: 'string',
        enabled: 'boolean',
        missing: 'null',
      },
    });
  });

  it('returns an empty object for null or undefined input', () => {
    expect(getObjStructure(null)).toStrictEqual({});
    expect(getObjStructure(undefined)).toStrictEqual({});
  });

  it('does not mutate the original object', () => {
    const original = { data: { value: 42 } };

    getObjStructure(original);

    expect(original).toStrictEqual({ data: { value: 42 } });
  });
});
