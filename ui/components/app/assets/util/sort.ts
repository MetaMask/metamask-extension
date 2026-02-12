import { get } from 'lodash';

export type SortOrder = 'asc' | 'dsc';
export type SortCriteria = {
  key: string;
  order?: 'asc' | 'dsc';
  sortCallback: SortCallbackKeys;
};

export type SortingType = number | string | Date;
type SortCallbackKeys = keyof SortingCallbacksT;

export type SortingCallbacksT = {
  numeric: (a: number, b: number) => number;
  stringNumeric: (a: string, b: string) => number;
  alphaNumeric: (a: string, b: string) => number;
  date: (a: Date, b: Date) => number;
};

// All sortingCallbacks should be asc order, sortAssets function handles asc/dsc
const sortingCallbacks: SortingCallbacksT = {
  numeric: (a: number, b: number) => a - b,
  stringNumeric: (a: string | null, b: string | null) => {
    const numA = a ? parseFloat(parseFloat(a).toFixed(5)) : 0;
    const numB = b ? parseFloat(parseFloat(b).toFixed(5)) : 0;
    return numA - numB;
  },
  alphaNumeric: (a: string | null, b: string | null) => {
    const valueA = a ?? '';
    const valueB = b ?? '';
    return valueA.localeCompare(valueB);
  },
  date: (a: Date, b: Date) => a.getTime() - b.getTime(),
};

// Utility function to access nested properties by key path
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function getNestedValue<T>(obj: T, keyPath: string): SortingType {
  return get(obj, keyPath) as SortingType;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function sortAssets<T>(array: T[], criteria: SortCriteria): T[] {
  const { key, order = 'asc', sortCallback } = criteria;

  return [...array].sort((a, b) => {
    const aValue = getNestedValue(a, key);
    const bValue = getNestedValue(b, key);

    // Always move undefined values to the end, regardless of sort order
    if (aValue === undefined) {
      return 1;
    }

    if (bValue === undefined) {
      return -1;
    }

    let comparison: number;

    switch (sortCallback) {
      case 'stringNumeric':
      case 'alphaNumeric':
        comparison = sortingCallbacks[sortCallback](
          aValue as string,
          bValue as string,
        );
        break;
      case 'numeric':
        comparison = sortingCallbacks.numeric(
          aValue as number,
          bValue as number,
        );
        break;
      case 'date':
        comparison = sortingCallbacks.date(aValue as Date, bValue as Date);
        break;
      default:
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        } else {
          comparison = 0;
        }
    }

    // Modify to sort in ascending or descending order
    return order === 'asc' ? comparison : -comparison;
  });
}
