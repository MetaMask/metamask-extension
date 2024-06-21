import {
  FALLBACK_VARIATION,
  NameEntry,
  NameType,
} from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getCurrentChainId, getNames } from '../selectors';

export type UseNameRequest = {
  value: string;
  type: NameType;
  variation?: string;
};

export function useName(
  value: string,
  type: NameType,
  variation?: string,
): NameEntry {
  return useNames([{ value, type, variation }])[0];
}

export function useNames(requests: UseNameRequest[]): NameEntry[] {
  const names = useSelector(getNames, isEqual);
  const chainId = useSelector(getCurrentChainId);

  return requests.map(({ value, type, variation }) => {
    const normalizedValue = normalizeValue(value, type);
    const typeVariationKey = getVariationKey(type, chainId);
    const variationKey = variation ?? typeVariationKey;
    const variationsToNameEntries = names[type]?.[normalizedValue] ?? {};
    const variationEntry = variationsToNameEntries[variationKey];
    const fallbackEntry = variationsToNameEntries[FALLBACK_VARIATION];

    const entry =
      !variationEntry?.name && fallbackEntry
        ? fallbackEntry
        : variationEntry ?? {};

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

function getVariationKey(type: string, chainId: string): string {
  switch (type) {
    case NameType.ETHEREUM_ADDRESS:
      return chainId;

    default:
      return '';
  }
}
