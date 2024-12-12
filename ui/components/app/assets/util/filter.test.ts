import { filterAssets, FilterCriteria } from './filter';

describe('filterAssets function - balance and chainId filtering', () => {
  type MockToken = {
    name: string;
    symbol: string;
    chainId: string; // Updated to string (e.g., '0x01', '0x89')
    balance: number;
  };

  const mockTokens: MockToken[] = [
    { name: 'Token1', symbol: 'T1', chainId: '0x01', balance: 100 },
    { name: 'Token2', symbol: 'T2', chainId: '0x02', balance: 50 },
    { name: 'Token3', symbol: 'T3', chainId: '0x01', balance: 200 },
    { name: 'Token4', symbol: 'T4', chainId: '0x89', balance: 150 },
  ];

  test('filters by inclusive chainId', () => {
    const criteria: FilterCriteria[] = [
      {
        key: 'chainId',
        opts: { '0x01': true, '0x89': true }, // ChainId must be '0x01' or '0x89'
        filterCallback: 'inclusive',
      },
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(3); // Should include 3 tokens with chainId '0x01' and '0x89'
    expect(filtered.map((token) => token.chainId)).toEqual([
      '0x01',
      '0x01',
      '0x89',
    ]);
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
        opts: { '0x01': true, '0x89': true }, // ChainId must be '0x01' or '0x89'
        filterCallback: 'inclusive',
      },
      {
        key: 'balance',
        opts: { min: 100, max: 150 }, // Balance between 100 and 150
        filterCallback: 'range',
      },
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(2); // Token1 and Token4 meet both criteria
  });

  test('returns no tokens if no chainId matches', () => {
    const criteria: FilterCriteria[] = [
      {
        key: 'chainId',
        opts: { '0x04': true }, // No token with chainId '0x04'
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
