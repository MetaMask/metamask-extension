import React from 'react';
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
};

export const CreateSnapAccount = ({
  onActionComplete,
  onSelectSrp,
  selectedKeyringId,
  clientType,
  chainId,
}: CreateSnapAccountProps) => {
  const snapClient = useMultichainWalletSnapClient(clientType);

  const onCreateAccount = async (suggestedName?: string) => {
    try {
      await snapClient.createAccount(chainId, selectedKeyringId, suggestedName);
      onActionComplete(true);
    } catch (error) {
      onActionComplete(false);
    }
  };

  const getNextAccountName = async () => {
    return getNextAvailableAccountName({
      keyringType: KeyringTypes.snap,
      entropySource: selectedKeyringId,
      chainId,
    });
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAccountName}
      onSelectSrp={onSelectSrp}
      selectedKeyringId={selectedKeyringId}
      chainId={chainId}
    />
  );
};
