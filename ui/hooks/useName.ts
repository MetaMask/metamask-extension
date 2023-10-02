import { NameEntry, NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getCurrentChainId, getNames } from '../selectors';

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

export function useName(
  value: string,
  type: NameType,
  variation?: string,
): NameEntry {
  const names = useSelector(getNames, isEqual);
  const chainId = useSelector(getCurrentChainId);
  const normalizedValue = normalizeValue(value, type);
  const typeVariationKey = getVariationKey(type, chainId);
  const variationKey = variation ?? typeVariationKey;
  const nameEntry = names[type]?.[normalizedValue]?.[variationKey];

  return {
    name: nameEntry?.name ?? null,
    sourceId: nameEntry?.sourceId ?? null,
    proposedNames: nameEntry?.proposedNames ?? {},
  };
}
