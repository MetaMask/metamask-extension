import React, { useCallback, useRef } from 'react';
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
  const isCreatingAccount = useRef(false);

  const onCreateAccount = useCallback(
    async (_accountNameSuggestion?: string) => {
      if (isCreatingAccount.current) {
        return;
      }

      try {
        isCreatingAccount.current = true;
        await snapClient.createAccount({
          scope: chainId,
          ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
          entropySource: selectedKeyringId,
          accountNameSuggestion: _accountNameSuggestion,
          ///: END:ONLY_INCLUDE_IF(multi-srp)
        });
        onActionComplete(true);
      } catch (error) {
        onActionComplete(false);
      } finally {
        isCreatingAccount.current = false;
      }
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
      scope={chainId}
      ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
      onSelectSrp={onSelectSrp}
      selectedKeyringId={selectedKeyringId}
      ///: END:ONLY_INCLUDE_IF(multi-srp)
    />
  );
};
