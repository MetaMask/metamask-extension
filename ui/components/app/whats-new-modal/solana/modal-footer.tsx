import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import { ModalFooterProps } from '../../../../../shared/notifications';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  WalletClientType,
  useMultichainWalletSnapClient,
} from '../../../../hooks/accounts/useMultichainWalletSnapClient';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getMetaMaskKeyrings,
  hasCreatedSolanaAccount,
} from '../../../../selectors';
import {
  ModalFooter as BaseModalFooter,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';

export const SolanaModalFooter = ({ onAction, onCancel }: ModalFooterProps) => {
  const t = useI18nContext();
  const solanaWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Solana,
  );
  const hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  const [primaryKeyring] = useSelector(getMetaMaskKeyrings);
  const trackEvent = useContext(MetaMetricsContext);

  const handleCreateSolanaAccount = async () => {
    await Promise.all([
      // Open the Solana account creation flow...
      solanaWalletSnapClient.createAccount(
        MultichainNetworks.SOLANA,
        primaryKeyring.metadata.id,
      ),
      // ... while closing the "What's New" modal behind it
      setTimeout(onAction, 500),
    ]);
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WhatsNewClicked,
      properties: {
        feature: 'solana',
        action: 'create-solana-account',
      },
    });
  };

  const handleGotIt = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WhatsNewClicked,
      properties: {
        feature: 'solana',
        action: 'got-it',
      },
    });
    await onAction();
  };

  return (
    <BaseModalFooter paddingTop={4} data-testid="solana-modal-footer">
      <Button
        block
        size={ButtonSize.Md}
        variant={ButtonVariant.Primary}
        data-testid={
          hasSolanaAccount ? 'got-it-button' : 'create-solana-account-button'
        }
        onClick={hasSolanaAccount ? handleGotIt : handleCreateSolanaAccount}
      >
        {hasSolanaAccount ? t('gotIt') : t('createSolanaAccount')}
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
