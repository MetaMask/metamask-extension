import React, { useCallback } from 'react';
import { CaipChainId } from '@metamask/utils';
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
  /**
   * Callback to select the SRP
   */
  onSelectSrp?: () => void;
  /**
   * The keyring ID to create the account
   */
  selectedKeyringId?: string;
  /**
   * The type of snap client to use
   */
  clientType: WalletClientType;
  /**
   * The chain ID to create the account
   */
  chainId: CaipChainId;
  /**
   * Whether to set the newly created account as the selected account
   */
  setNewlyCreatedAccountAsSelected?: boolean;
};

export const CreateSnapAccount = ({
  onActionComplete,
  onSelectSrp,
  selectedKeyringId,
  clientType,
  chainId,
  setNewlyCreatedAccountAsSelected,
}: CreateSnapAccountProps) => {
  const client = useMultichainWalletSnapClient(clientType);

  const onCreateAccount = useCallback(
    async (accountNameSuggestion?: string) => {
      await client.createAccount(
        {
          scope: chainId,
          entropySource: selectedKeyringId,
          accountNameSuggestion,
        },
        { setSelectedAccount: setNewlyCreatedAccountAsSelected },
      );
      onActionComplete(true);
    },
    [client, chainId, selectedKeyringId, onActionComplete],
  );

  const getNextAccountName = async () => {
    return await client.getNextAvailableAccountName({
      chainId,
    });
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAccountName}
      scope={chainId}
      onSelectSrp={onSelectSrp}
      selectedKeyringId={selectedKeyringId}
    />
  );
};
