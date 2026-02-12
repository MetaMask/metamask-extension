import { get } from 'lodash';

export type FilterCriteria = {
  key: string;
  opts: Record<string, FilterType>; // Use opts for range, inclusion, etc.
  filterCallback: FilterCallbackKeys; // Specify the type of filter: 'range', 'inclusive', etc.
};

export type FilterType = string | number | boolean | Date;
type FilterCallbackKeys = keyof FilterCallbacksT;

export type FilterCallbacksT = {
  inclusive: (value: string, opts: Record<string, boolean>) => boolean;
  range: (value: number, opts: Record<string, number>) => boolean;
};

const filterCallbacks: FilterCallbacksT = {
  inclusive: (value: string, opts: Record<string, boolean>) => {
    if (Object.entries(opts).length === 0) {
      return false;
    }
    return opts[value];
  },
  range: (value: number, opts: Record<string, number>) =>
    value >= opts.min && value <= opts.max,
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function getNestedValue<T>(obj: T, keyPath: string): FilterType {
  return get(obj, keyPath);
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function filterAssets<T>(assets: T[], criteria: FilterCriteria[]): T[] {
  if (criteria.length === 0) {
    return assets;
  }

  return assets.filter((asset) =>
    criteria.every(({ key, opts, filterCallback }) => {
      const nestedValue = getNestedValue(asset, key);

      // If there's no callback or options, exit early and don't filter based on this criterion.
      if (!filterCallback || !opts) {
        return true;
      }

      switch (filterCallback) {
        case 'inclusive':
          return filterCallbacks.inclusive(
            nestedValue as string,
            opts as Record<string, boolean>,
          );
        case 'range':
          return filterCallbacks.range(
            nestedValue as number,
            opts as { min: number; max: number },
          );
        default:
          return true;
      }
    }),
  );
}
