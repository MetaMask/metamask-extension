import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { KeyringMetadata, KeyringObject } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getInternalAccounts } from '../../selectors/accounts';
import { getMetaMaskHdKeyrings } from '../../selectors';

// TODO: Move this data type to the @metamask/keyring-controller module
type KeyringObjectWithMetadata = KeyringObject & { metadata: KeyringMetadata };

/**
 * Custom hook that combines HD keyrings with their snap accounts that were derived from the same entropy source.
 *
 * @returns An array of hd keyring objects with any snap accounts that were derived from the same entropy source.
 */
export const useHdKeyringsWithSnapAccounts = () => {
  const hdKeyrings: KeyringObjectWithMetadata[] = useSelector(
    getMetaMaskHdKeyrings,
  );
  const internalAccounts = useSelector(getInternalAccounts);
  return useMemo(() => {
    return hdKeyrings.map((keyring) => {
      const firstPartySnapAccounts = internalAccounts
        .filter(
          (account: InternalAccount) =>
            account.options?.entropySource === keyring.metadata.id,
        )
        .map((account: InternalAccount) => account.address);

      return {
        ...keyring,
        accounts: [...keyring.accounts, ...firstPartySnapAccounts],
      };
    });
  }, [hdKeyrings, internalAccounts]);
};
