import { NameEntry, NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getCurrentChainId, getNames } from '../selectors';

export function useName(
  value: string,
  type: NameType,
  variation?: string,
): NameEntry {
  const names = useSelector(getNames, isEqual);
  const chainId = useSelector(getCurrentChainId);

  const variationKey =
    variation ?? (type === NameType.ETHEREUM_ADDRESS ? chainId : '');

  const nameEntry = names[type]?.[value]?.[variationKey];

  return {
    name: nameEntry?.name ?? null,
    sourceId: nameEntry?.sourceId ?? null,
    proposedNames: nameEntry?.proposedNames ?? {},
    proposedNamesLastUpdated: nameEntry?.proposedNamesLastUpdated ?? null,
  };
}
