import { describe, it } from '@jest/globals';
import {
  buildShapeProfile,
  countSignificantDigits,
  diffShapes,
  isShapeDiffEmpty,
  normalizePath,
} from './shape-diff';

describe('countSignificantDigits', () => {
  it.each([
    [0, 1],
    [3010, 3],
    [382623505141, 12],
    [0.300106, 6],
    [0.07086574003221964, 16],
    [2130.2485466970497, 17],
  ])('counts %p as %p significant digits', (value, expected) => {
    expect(countSignificantDigits(value)).toBe(expected);
  });
});

describe('normalizePath', () => {
  it('replaces array indices with [*]', () => {
    expect(normalizePath('$.data[3].tokens[0].balance')).toBe(
      '$.data[*].tokens[*].balance',
    );
  });

  it('replaces keys under wildcard key paths with .*', () => {
    expect(
      normalizePath('$["eip155:1/slip44:60"].price', {
        wildcardKeyPaths: ['$'],
      }),
    ).toBe('$.*.price');
  });

  it('keeps quoted keys outside wildcard key paths', () => {
    expect(normalizePath('$.prices["eip155:1/slip44:60"]')).toBe(
      '$.prices["eip155:1/slip44:60"]',
    );
  });
});

describe('diffShapes', () => {
  it('returns an empty diff when the mocks cover the live response', () => {
    const live = buildShapeProfile([{ items: [{ id: 'a', price: 1 }] }]);
    const mocks = buildShapeProfile([
      { items: [] },
      { items: [{ id: 'b', price: 2 }] },
    ]);

    expect(isShapeDiffEmpty(diffShapes(live, mocks))).toBe(true);
  });

  it('reports fields, value kinds and high-precision numbers the mocks lack', () => {
    const live = buildShapeProfile(
      [
        {
          'eip155:1/slip44:60': {
            price: 2130.2485466970497,
            pricePercentChange1y: null,
            liquidity: { usd: 1 },
          },
        },
      ],
      { wildcardKeyPaths: ['$'] },
    );
    const mocks = buildShapeProfile(
      [
        {
          'eip155:1337/slip44:1': {
            price: 3010,
            pricePercentChange1y: 0,
            marketCap: 1,
          },
        },
      ],
      { wildcardKeyPaths: ['$'] },
    );

    expect(diffShapes(live, mocks)).toStrictEqual({
      missingInMocks: ['$.*.liquidity'],
      uncoveredKinds: [
        {
          path: '$.*.pricePercentChange1y',
          live: ['null'],
          mocks: ['number'],
        },
      ],
      uncoveredHighPrecision: ['$.*.price'],
      onlyInMocks: ['$.*.marketCap'],
    });
  });
});
