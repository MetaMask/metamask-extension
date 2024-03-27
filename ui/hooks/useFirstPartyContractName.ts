import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { getCurrentChainId } from '../selectors';
import { FIRST_PARTY_CONTRACT_NAMES } from '../../shared/constants/first-party-contracts';

export type UseFirstPartyContractNameRequest = {
  value: string;
  type: NameType;
  variation?: string;
};

export function useFirstPartyContractNames(
  requests: UseFirstPartyContractNameRequest[],
): (string | null)[] {
  const currentChainId = useSelector(getCurrentChainId);

  return requests.map(({ type, value, variation }) => {
    if (type !== NameType.ETHEREUM_ADDRESS) {
      return null;
    }

    const chainId = variation ?? currentChainId;
    const normalizedValue = value.toLowerCase();

    return (
      Object.keys(FIRST_PARTY_CONTRACT_NAMES).find(
        (name) =>
          FIRST_PARTY_CONTRACT_NAMES[name]?.[chainId]?.toLowerCase() ===
          normalizedValue,
      ) ?? null
    );
  });
}

export function useFirstPartyContractName(
  value: string,
  type: NameType,
  variation?: string,
): string | null {
  return useFirstPartyContractNames([{ value, type, variation }])[0];
}
