interface SortCriteria<T> {
  key: string; // Deeply nested keys supported: 'profile.balance'
  order?: SortOrder;
  sortCallback?: string;
}

export type SortOrder = 'asc' | 'dsc';

// All sortingCallbacks should be asc order, sortAssets function handles asc/dsc
const sortingCallbacks: { [key: string]: (a: any, b: any) => number } = {
  numeric: (a: number, b: number) => a - b,
  stringNumeric: (a: string, b: string) => parseInt(a) - parseInt(b),
  alphaNumeric: (a: string, b: string) => a.localeCompare(b),
  date: (a: Date, b: Date) => a.getTime() - b.getTime(),
};

// Utility function to access nested properties by key path
function getNestedValue<T>(obj: T, keyPath: string): any {
  return keyPath
    .split('.')
    .reduce((value: any, key: string) => value[key], obj);
}

export function sortAssets<T>(array: T[], criteria: SortCriteria<T>): T[] {
  const { key, order = 'asc', sortCallback } = criteria;

  return [...array].sort((a, b) => {
    const aValue = getNestedValue(a, key);
    const bValue = getNestedValue(b, key);

    let comparison: number;

    if (sortCallback && sortingCallbacks[sortCallback]) {
      comparison = sortingCallbacks[sortCallback](aValue, bValue);
    } else {
      comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }

    // modify to sort in asc or dsc order
    return order === 'asc' ? comparison : -comparison;
  });
}
