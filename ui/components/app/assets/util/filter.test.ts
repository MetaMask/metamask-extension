import { filterAssets, FilterCriteria } from './filter';

describe('filterAssets function - balance and chainId filtering', () => {
  type MockToken = {
    name: string;
    symbol: string;
    chainId: number;
    balance: number;
  };

  const mockTokens: MockToken[] = [
    { name: 'Token1', symbol: 'T1', chainId: 1, balance: 100 },
    { name: 'Token2', symbol: 'T2', chainId: 2, balance: 50 },
    { name: 'Token3', symbol: 'T3', chainId: 1, balance: 200 },
    { name: 'Token4', symbol: 'T4', chainId: 3, balance: 150 },
  ];

  test('filters by inclusive chainId', () => {
    const criteria: FilterCriteria[] = [
      {
        key: 'chainId',
        opts: { '1': true, '3': true }, // ChainId must be 1 or 3
        filterCallback: 'inclusive',
      },
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(3);
    expect(filtered.map((token) => token.chainId)).toEqual([1, 1, 3]);
  });

  test('filters tokens with balance between 100 and 150 inclusive', () => {
    const criteria: FilterCriteria[] = [
      {
        key: 'balance',
        opts: { min: 100, max: 150 }, // Balance between 100 and 150
        filterCallback: 'range',
      },
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(2); // Token1 and Token4
    expect(filtered.map((token) => token.balance)).toEqual([100, 150]);
  });

  test('filters by inclusive chainId and balance range', () => {
    const criteria: FilterCriteria[] = [
      {
        key: 'chainId',
        opts: { '1': true, '3': true }, // ChainId must be 1 or 3
        filterCallback: 'inclusive',
      },
      {
        key: 'balance',
        opts: { min: 100, max: 150 }, // Balance between 100 and 150
        filterCallback: 'range',
      },
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(2);
  });

  test('returns no tokens if no chainId matches', () => {
    const criteria: FilterCriteria[] = [
      {
        key: 'chainId',
        opts: { '4': true }, // No token with chainId 4
        filterCallback: 'inclusive',
      },
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(0); // No matching tokens
  });

  test('returns no tokens if balance is not within range', () => {
    const criteria: FilterCriteria[] = [
      {
        key: 'balance',
        opts: { min: 300, max: 400 }, // No token with balance between 300 and 400
        filterCallback: 'range',
      },
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(0); // No matching tokens
  });
});
