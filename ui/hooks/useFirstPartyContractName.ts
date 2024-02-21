import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { getCurrentChainId } from '../selectors';
import { FIRST_PARTY_CONTRACT_NAMES } from './useFirstPartyContractNameData';

export function useFirstPartyContractName(
  value: string,
  type: NameType,
  variation?: string,
): string | null {
  if (type !== NameType.ETHEREUM_ADDRESS) {
    return null;
  }
  const currentChainId = useSelector(getCurrentChainId);
  const chainId = variation ?? currentChainId;
  const normalizedValue = value.toLowerCase();

  for (const name of Object.keys(FIRST_PARTY_CONTRACT_NAMES)) {
    const contractAddress = FIRST_PARTY_CONTRACT_NAMES[name]?.[chainId];
    if (normalizedValue === contractAddress?.toLowerCase()) {
      return name;
    }
  }
  return null;
}
