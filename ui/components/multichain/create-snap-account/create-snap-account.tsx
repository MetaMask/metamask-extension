import React, { useCallback } from 'react';
import { CaipChainId } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { getNextAvailableAccountName } from '../../../store/actions';
import { CreateAccount } from '../create-account';
import {
  WalletClientType,
  useMultichainWalletSnapClient,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

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

  const onCreateAccount = useCallback(
    async (_accountNameSuggestion?: string) => {
      snapClient.createAccount({
        scope: chainId,
        entropySource: selectedKeyringId,
        accountNameSuggestion: _accountNameSuggestion,
      });
      onActionComplete(true);
    },
    [snapClient, chainId, selectedKeyringId, onActionComplete],
  );

  const getNextAccountName = async () => {
    const defaultSnapAccountName = await getNextAvailableAccountName(
      KeyringTypes.snap,
    );

    // FIXME: This is a temporary workaround to suggest a different account name for a first party snap.
    const accountNumber = defaultSnapAccountName.trim().split(' ').pop();

    switch (clientType) {
      case WalletClientType.Bitcoin: {
        if (chainId === MultichainNetworks.BITCOIN_TESTNET) {
          return `Bitcoin Testnet Account ${accountNumber}`;
        }
        return `Bitcoin Account ${accountNumber}`;
      }
      case WalletClientType.Solana: {
        if (chainId === MultichainNetworks.SOLANA_TESTNET) {
          return `Solana Testnet Account ${accountNumber}`;
        }
        if (chainId === MultichainNetworks.SOLANA_DEVNET) {
          return `Solana Devnet Account ${accountNumber}`;
        }
        return `Solana Account ${accountNumber}`;
      }
      default:
        return defaultSnapAccountName;
    }
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAccountName}
      onSelectSrp={onSelectSrp}
      selectedKeyringId={selectedKeyringId}
    />
  );
};
