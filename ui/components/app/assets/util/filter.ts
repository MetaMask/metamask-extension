import { get } from 'lodash';

export type FilterCriteria = {
  key: string;
  opts?: Record<string, FilterType>; // Use opts for range, inclusion, etc.
  filterCallback?: FilterCallbackKeys; // Specify the type of filter: 'range', 'inclusive', etc.
};

export type FilterType = string | number | boolean | Date;
type FilterCallbackKeys = keyof FilterCallbacksT;

export type FilterCallbacksT = {
  inclusive: (value: string, opts: Record<string, boolean>) => boolean;
  range: (value: number, opts: Record<string, number>) => boolean;
};

const filterCallbacks: FilterCallbacksT = {
  inclusive: (value: string, opts: Record<string, boolean>) => opts[value],
  range: (value: number, opts: Record<string, number>) =>
    value >= opts.min && value <= opts.max,
};

function getNestedValue<T>(obj: T, keyPath: string): FilterType {
  return get(obj, keyPath);
}

export function filterAssets<T>(array: T[], criteria: FilterCriteria[]): T[] {
  if (criteria.length === 0) {
    return array;
  }

  return array.filter((item) => {
    return criteria.every((criterion) => {
      const { key, opts, filterCallback } = criterion;
      const nestedValue = getNestedValue(item, key);

      if (filterCallback && opts) {
        switch (filterCallback) {
          case 'inclusive':
            if (typeof nestedValue === 'string') {
              return filterCallbacks.inclusive(
                nestedValue,
                opts as Record<string, boolean>,
              );
            }
            return false;
          case 'range':
            // Type guard to ensure nestedValue is a number
            if (typeof nestedValue === 'number') {
              return filterCallbacks.range(
                nestedValue,
                opts as {
                  min: number;
                  max: number;
                },
              );
            }
            return false; // If not a number, range filtering cannot be applied
          default:
            return true;
        }
      }

      return true; // Default case, return true to include item if no conditions are met
    });
  });
}
