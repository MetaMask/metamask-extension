import { filterAssets, FilterCriteria } from './filter'; // Assuming the filter function is in a file named 'filter.ts'

type MockToken = {
  name: string;
  symbol: string;
  chainId: number;
};

const mockTokens: MockToken[] = [
  { name: 'Token1', symbol: 'T1', chainId: 1 },
  { name: 'Token2', symbol: 'T2', chainId: 2 },
  { name: 'Token3', symbol: 'T3', chainId: 1 },
  { name: 'Token4', symbol: 'T4', chainId: 3 },
];

// Define the filtering tests for chainId
describe('filterAssets function - chainId', () => {
  test('filters by chainId including chainId 1 and 3', () => {
    const criteria: FilterCriteria[] = [
      { key: 'chainId', values: { '1': 'true', '3': 'true' } }, // Only include chainId 1 and 3
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(3);
    expect(filtered.map((token) => token.chainId)).toEqual([1, 1, 3]);
  });

  test('filters by chainId including only chainId 2', () => {
    const criteria: FilterCriteria[] = [
      { key: 'chainId', values: { '2': 'true' } }, // Only include chainId 2
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(1);
    expect(filtered[0].chainId).toBe(2);
  });

  test('returns all tokens if criteria is empty', () => {
    const criteria: FilterCriteria[] = []; // No criteria, should return all tokens

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(mockTokens.length);
  });

  test('filters by chainId excluding all tokens', () => {
    const criteria: FilterCriteria[] = [
      { key: 'chainId', values: { '4': 'true' } }, // No token with chainId 4, should return empty array
    ];

    const filtered = filterAssets(mockTokens, criteria);

    expect(filtered.length).toBe(0);
  });
});
