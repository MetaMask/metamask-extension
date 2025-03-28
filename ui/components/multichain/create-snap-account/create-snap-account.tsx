import React, { useCallback } from 'react';
import { CaipChainId } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { getNextAvailableAccountName } from '../../../store/actions';
import { CreateAccount } from '../create-account';
import {
  WalletClientType,
  useMultichainWalletSnapClient,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';

type CreateSnapAccountProps = {
  /**
   * Executes when the Create button is clicked
   */
  onActionComplete: (completed: boolean) => Promise<void>;
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  /**
   * Callback to select the SRP
   */
  onSelectSrp?: () => void;
  /**
   * The keyring ID to create the account
   */
  selectedKeyringId?: string;
  ///: END:ONLY_INCLUDE_IF(multi-srp)
  /**
   * The type of snap client to use
   */
  clientType: WalletClientType;
  /**
   * The chain ID to create the account
   */
  chainId: CaipChainId;
};

export const CreateSnapAccount = ({
  onActionComplete,
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  onSelectSrp,
  selectedKeyringId,
  ///: END:ONLY_INCLUDE_IF(multi-srp)
  clientType,
  chainId,
}: CreateSnapAccountProps) => {
  const snapClient = useMultichainWalletSnapClient(clientType);

  const onCreateAccount = useCallback(
    async (suggestedName?: string) => {
      try {
        await snapClient.createAccount(
          chainId,
          ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
          selectedKeyringId,
          ///: END:ONLY_INCLUDE_IF(multi-srp)
          suggestedName,
        );
        onActionComplete(true);
      } catch (error) {
        onActionComplete(false);
      }
    },
    [snapClient, chainId, selectedKeyringId, onActionComplete],
  );

  const getNextAccountName = async () => {
    return getNextAvailableAccountName(KeyringTypes.snap);
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAccountName}
      ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
      onSelectSrp={onSelectSrp}
      selectedKeyringId={selectedKeyringId}
      ///: END:ONLY_INCLUDE_IF(multi-srp)
    />
  );
};
