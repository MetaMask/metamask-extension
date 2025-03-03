import React from 'react';
import {
  ModalFooter as BaseModalFooter,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  WalletClientType,
  useMultichainWalletSnapClient,
} from '../../../../hooks/accounts/useMultichainWalletSnapClient';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import { useSelector } from 'react-redux';
import { getMetaMaskKeyrings } from '../../../../selectors';

type ModalFooterProps = {
  onAction: () => void;
  onCancel: () => void;
};

export const SolanaModalFooter = ({ onAction, onCancel }: ModalFooterProps) => {
  const t = useI18nContext();
  const solanaWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Solana,
  );
  const [primaryKeyring] = useSelector(getMetaMaskKeyrings);

  return (
    <BaseModalFooter paddingTop={4} data-testid="solana-modal-footer">
      <Button
        block
        size={ButtonSize.Md}
        variant={ButtonVariant.Primary}
        data-testid="create-solana-account-button"
        onClick={async () => {
          onAction();

          await solanaWalletSnapClient.createAccount(
            MultichainNetworks.SOLANA,
            primaryKeyring.metadata.id,
          );
        }}
      >
        {t('createSolanaAccount')}
      </Button>
      <Button
        block
        size={ButtonSize.Md}
        variant={ButtonVariant.Link}
        data-testid="not-now-button"
        onClick={onCancel}
      >
        {t('notNow')}
      </Button>
    </BaseModalFooter>
  );
};
