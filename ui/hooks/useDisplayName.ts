import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { getMemoizedMetadataContractName } from '../selectors';
import { useName } from './useName';

/**
 * Attempts to resolve the name for the given parameters.
 *
 * @param value
 * @param type
 * @param variation
 * @returns The name if it can be resolved, otherwise null.
 */
export function useDisplayName(
  value: string,
  type: NameType,
  variation?: string,
): string | null {
  const nameEntry = useName(value, type, variation);
  if (nameEntry?.name) {
    return nameEntry.name;
  }
  const contractName = useSelector((state) =>
    (getMemoizedMetadataContractName as any)(state, value),
  );
  if (contractName) {
    return contractName;
  }
  return null;
}
