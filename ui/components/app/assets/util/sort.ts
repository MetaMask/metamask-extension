export type SortOrder = 'asc' | 'dsc';

type SortingType = number | string | Date;
type SortingCallbacks = {
  numeric: (a: number, b: number) => number;
  stringNumeric: (a: string, b: string) => number;
  alphaNumeric: (a: string, b: string) => number;
  date: (a: Date, b: Date) => number;
};
type SortCallbackKeys = keyof SortingCallbacks;
type SortCriteria = {
  key: string;
  order?: 'asc' | 'desc';
  sortCallback: SortCallbackKeys;
};

// All sortingCallbacks should be asc order, sortAssets function handles asc/dsc
const sortingCallbacks: SortingCallbacks = {
  numeric: (a: number, b: number) => a - b,
  stringNumeric: (a: string, b: string) => parseInt(a) - parseInt(b),
  alphaNumeric: (a: string, b: string) => a.localeCompare(b),
  date: (a: Date, b: Date) => a.getTime() - b.getTime(),
};

// Utility function to access nested properties by key path
function getNestedValue<T>(obj: T, keyPath: string): SortingType {
  return keyPath
    .split('.')
    .reduce((value: any, key: string) => value[key], obj);
}

export function sortAssets<T>(array: T[], criteria: SortCriteria): T[] {
  const { key, order = 'asc', sortCallback } = criteria;

  return [...array].sort((a, b) => {
    const aValue = getNestedValue(a, key);
    const bValue = getNestedValue(b, key);

    let comparison: number;

    let callback = sortingCallbacks[sortCallback];

    if (sortCallback && callback) {
      comparison = callback(aValue, bValue);
    } else {
      comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }

    // modify to sort in asc or dsc order
    return order === 'asc' ? comparison : -comparison;
  });
}
