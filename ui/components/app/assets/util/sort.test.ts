import { sortAssets } from './sort';

type MockAsset = {
  name: string;
  balance: string;
  createdAt: Date;
  profile: {
    id: string;
    info?: {
      category?: string;
    };
  };
};

const mockAssets: MockAsset[] = [
  {
    name: 'Asset Z',
    balance: '500',
    createdAt: new Date('2023-01-01'),
    profile: { id: '1', info: { category: 'gold' } },
  },
  {
    name: 'Asset A',
    balance: '600',
    createdAt: new Date('2022-05-15'),
    profile: { id: '4', info: { category: 'silver' } },
  },
  {
    name: 'Asset B',
    balance: '400',
    createdAt: new Date('2021-07-20'),
    profile: { id: '2', info: { category: 'bronze' } },
  },
];

// Define the sorting tests
describe('sortAssets function - nested value handling with dates and numeric sorting', () => {
  test('sorts by name in ascending order', () => {
    const sortedByName = sortAssets(mockAssets, {
      key: 'name',
      sortCallback: 'alphaNumeric',
      order: 'asc',
    });

    expect(sortedByName[0].name).toBe('Asset A');
    expect(sortedByName[sortedByName.length - 1].name).toBe('Asset Z');
  });

  test('should handle null values in alphanumeric sorting gracefully', () => {
    const badAsset = {
      name: null,
      balance: '400',
      createdAt: new Date('2021-07-20'),
      profile: { id: '2', info: { category: 'bronze' } },
    };
    const sortedByName = sortAssets([...mockAssets, badAsset], {
      key: 'name',
      sortCallback: 'alphaNumeric',
      order: 'asc',
    });

    expect(sortedByName[0].name).toBe(null);
    expect(sortedByName[sortedByName.length - 1].name).toBe('Asset Z');
  });

  test('sorts by balance in ascending order (stringNumeric)', () => {
    const sortedById = sortAssets(mockAssets, {
      key: 'balance',
      sortCallback: 'stringNumeric',
      order: 'asc',
    });

    expect(sortedById[0].balance).toBe('400');
    expect(sortedById[sortedById.length - 1].balance).toBe('600');
  });

  test('sorts by balance in ascending order (numeric)', () => {
    const sortedById = sortAssets(mockAssets, {
      key: 'balance',
      sortCallback: 'numeric',
      order: 'asc',
    });

    expect(sortedById[0].balance).toBe('400');
    expect(sortedById[sortedById.length - 1].balance).toBe('600');
  });

  test('sorts by profile.id in ascending order', () => {
    const sortedById = sortAssets(mockAssets, {
      key: 'profile.id',
      sortCallback: 'stringNumeric',
      order: 'asc',
    });

    expect(sortedById[0].profile.id).toBe('1');
    expect(sortedById[sortedById.length - 1].profile.id).toBe('4');
  });

  test('sorts by profile.id in descending order', () => {
    const sortedById = sortAssets(mockAssets, {
      key: 'profile.id',
      sortCallback: 'stringNumeric',
      order: 'dsc',
    });

    expect(sortedById[0].profile.id).toBe('4');
    expect(sortedById[sortedById.length - 1].profile.id).toBe('1');
  });

  test('sorts by deeply nested profile.info.category in ascending order', () => {
    const sortedByCategory = sortAssets(mockAssets, {
      key: 'profile.info.category',
      sortCallback: 'alphaNumeric',
      order: 'asc',
    });

    // Expecting the assets with defined categories to be sorted first
    expect(sortedByCategory[0].profile.info?.category).toBe('bronze');
    expect(
      sortedByCategory[sortedByCategory.length - 1].profile.info?.category,
    ).toBe('silver');
  });

  test('sorts by createdAt (date) in ascending order', () => {
    const sortedByDate = sortAssets(mockAssets, {
      key: 'createdAt',
      sortCallback: 'date',
      order: 'asc',
    });

    expect(sortedByDate[0].createdAt).toEqual(new Date('2021-07-20'));
    expect(sortedByDate[sortedByDate.length - 1].createdAt).toEqual(
      new Date('2023-01-01'),
    );
  });

  test('sorts by createdAt (date) in descending order', () => {
    const sortedByDate = sortAssets(mockAssets, {
      key: 'createdAt',
      sortCallback: 'date',
      order: 'dsc',
    });

    expect(sortedByDate[0].createdAt).toEqual(new Date('2023-01-01'));
    expect(sortedByDate[sortedByDate.length - 1].createdAt).toEqual(
      new Date('2021-07-20'),
    );
  });

  test('handles undefined deeply nested value gracefully when sorting', () => {
    const invlaidAsset = {
      name: 'Asset Y',
      balance: '600',
      createdAt: new Date('2024-01-01'),
      profile: { id: '3' }, // No category info
    };
    const sortedByCategory = sortAssets([...mockAssets, invlaidAsset], {
      key: 'profile.info.category',
      sortCallback: 'alphaNumeric',
      order: 'asc',
    });

    // Expect the undefined categories to be at the end
    expect(
      // @ts-expect-error // testing for undefined value
      sortedByCategory[sortedByCategory.length - 1].profile.info?.category,
    ).toBeUndefined();
  });
});

// Utility function to generate large mock data
function generateLargeMockData(size: number): MockAsset[] {
  const mockData: MockAsset[] = [];
  for (let i = 0; i < size; i++) {
    mockData.push({
      name: `Asset ${String.fromCharCode(65 + (i % 26))}`,
      balance: `${Math.floor(Math.random() * 1000)}`, // Random balance between 0 and 999
      createdAt: new Date(Date.now() - Math.random() * 10000000000), // Random date within the past ~115 days
      profile: {
        id: `${i + 1}`,
        info: {
          category: ['gold', 'silver', 'bronze'][i % 3], // Cycles between 'gold', 'silver', 'bronze'
        },
      },
    });
  }
  return mockData;
}

// Generate a large dataset for testing
const largeDataset = generateLargeMockData(10000); // 10,000 mock assets

// Define the sorting tests for large datasets
describe('sortAssets function - large dataset handling', () => {
  const MAX_EXECUTION_TIME_MS = 500; // Set max allowed execution time (in milliseconds)

  test('sorts large dataset by name in ascending order', () => {
    const startTime = Date.now();
    const sortedByName = sortAssets(largeDataset, {
      key: 'name',
      sortCallback: 'alphaNumeric',
      order: 'asc',
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(sortedByName[0].name).toBe('Asset A');
    expect(sortedByName[sortedByName.length - 1].name).toBe('Asset Z');
    expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
  });

  test('sorts large dataset by balance in ascending order', () => {
    const startTime = Date.now();
    const sortedByBalance = sortAssets(largeDataset, {
      key: 'balance',
      sortCallback: 'numeric',
      order: 'asc',
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const balances = sortedByBalance.map((asset) => asset.balance);
    expect(balances).toEqual(
      balances.slice().sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
    );
    expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
  });

  test('sorts large dataset by balance in descending order', () => {
    const startTime = Date.now();
    const sortedByBalance = sortAssets(largeDataset, {
      key: 'balance',
      sortCallback: 'numeric',
      order: 'dsc',
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const balances = sortedByBalance.map((asset) => asset.balance);
    expect(balances).toEqual(
      balances.slice().sort((a, b) => parseInt(b, 10) - parseInt(a, 10)),
    );
    expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
  });

  test('sorts large dataset by createdAt (date) in ascending order', () => {
    const startTime = Date.now();
    const sortedByDate = sortAssets(largeDataset, {
      key: 'createdAt',
      sortCallback: 'date',
      order: 'asc',
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const dates = sortedByDate.map((asset) => asset.createdAt.getTime());
    expect(dates).toEqual(dates.slice().sort((a, b) => a - b));
    expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
  });

  test('sorts large dataset by createdAt (date) in descending order', () => {
    const startTime = Date.now();
    const sortedByDate = sortAssets(largeDataset, {
      key: 'createdAt',
      sortCallback: 'date',
      order: 'dsc',
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const dates = sortedByDate.map((asset) => asset.createdAt.getTime());
    expect(dates).toEqual(dates.slice().sort((a, b) => b - a));
    expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
  });
});
