import {
  FALLBACK_VARIATION,
  NameEntry,
  NameType,
} from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getNames } from '../selectors';

export type UseNameRequest = {
  value: string;
  type: NameType;
  variation: string;
};

export function useName(
  value: string,
  type: NameType,
  variation: string,
): NameEntry {
  return useNames([{ value, type, variation }])[0];
}

export function useNames(requests: UseNameRequest[]): NameEntry[] {
  const names = useSelector(getNames, isEqual);

  return requests.map(({ value, type, variation }) => {
    const normalizedValue = normalizeValue(value, type);
    const variationsToNameEntries = names[type]?.[normalizedValue] ?? {};
    const variationEntry = variationsToNameEntries[variation];
    const fallbackEntry = variationsToNameEntries[FALLBACK_VARIATION];

    const entry =
      !variationEntry?.name && fallbackEntry
        ? fallbackEntry
        : (variationEntry ?? {});

    const {
      name = null,
      sourceId = null,
      origin = null,
      proposedNames = {},
    } = entry;

    return {
      name,
      sourceId,
      proposedNames,
      origin,
    };
  });
}

function normalizeValue(value: string, type: string): string {
  switch (type) {
    case NameType.ETHEREUM_ADDRESS:
      return value.toLowerCase();

    default:
      return value;
  }
}
