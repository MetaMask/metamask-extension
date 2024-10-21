import { get } from 'lodash';

export type FilterCriteria = {
  key: string;
  values: Record<string, string>;
};

function getNestedValue<T>(obj: T, keyPath: string): any {
  return get(obj, keyPath);
}

export function filterAssets<T>(array: T[], criteria: FilterCriteria[]): T[] {
  // If no criteria, return all tokens
  if (criteria.length === 0) {
    return array;
  }

  return array.filter((item) => {
    return criteria.every((criterion) => {
      // key is the value of the objects to be sorted by (for instance chainId of each token)
      // criterion is the Record<chainId, boolean> to evaluate each token, and whether it should be included in the list. If true, include
      const { key, values } = criterion;
      const nestedValue = getNestedValue(item, key);
      return values[nestedValue];
    });
  });
}
