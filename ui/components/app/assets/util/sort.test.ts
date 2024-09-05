// Import necessary modules (assuming your function is in 'sort.ts')
import { sortAssets } from './sort';

// Define the MockAsset type for the test
type MockAsset = {
  name: string;
  balance: number;
  profile: {
    lastUpdated: Date;
  };
};

// Test data with balance at the root of MockAsset
const mockAssets: MockAsset[] = [
  {
    name: 'Asset Z',
    balance: 500,
    profile: { lastUpdated: new Date('2023-01-01') },
  },
  {
    name: 'Asset A',
    balance: 400,
    profile: { lastUpdated: new Date('2023-02-01') },
  },
  {
    name: 'Asset B',
    balance: 400,
    profile: { lastUpdated: new Date('2023-03-01') },
  },
  {
    name: 'Asset Y',
    balance: 600,
    profile: { lastUpdated: new Date('2023-04-01') },
  },
];

// Define the sorting tests
describe('sortAssets function', () => {
  test('should sort by balance in descending order', () => {
    const sortedByBalance = sortAssets(mockAssets, {
      key: 'balance',
      sortCallback: 'alphanumeric',
      order: 'dsc',
    });

    // The first item should have the highest balance
    expect(sortedByBalance[0].balance).toBe(600);
    // The last item should have the lowest balance
    expect(sortedByBalance[sortedByBalance.length - 1].balance).toBe(400);
  });

  test('should sort by lastUpdated (date) in ascending order', () => {
    const sortedByDate = sortAssets(mockAssets, {
      key: 'profile.lastUpdated',
      sortCallback: 'date',
      order: 'asc',
    });

    // The first item should have the earliest date
    expect(sortedByDate[0].profile.lastUpdated).toEqual(new Date('2023-01-01'));
    // The last item should have the latest date
    expect(sortedByDate[sortedByDate.length - 1].profile.lastUpdated).toEqual(
      new Date('2023-04-01'),
    );
  });

  test('should sort by name in alphabetical order', () => {
    const sortedByName = sortAssets(mockAssets, {
      key: 'name',
      sortCallback: 'string',
      order: 'asc',
    });

    // The first item should be Asset A (alphabetically first)
    expect(sortedByName[0].name).toBe('Asset A');
    // The last item should be Asset Z (alphabetically last)
    expect(sortedByName[sortedByName.length - 1].name).toBe('Asset Z');
  });
});
