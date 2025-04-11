// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ModalFooter as BaseModalFooter,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';

type ModalFooterProps = {
  onAction: () => void;
  onCancel: () => void;
};

export const SolanaModalFooter = ({ onAction, onCancel }: ModalFooterProps) => {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();

  return (
    <BaseModalFooter paddingTop={4} data-testid="solana-modal-footer">
      <Button
        block
        size={ButtonSize.Md}
        variant={ButtonVariant.Primary}
        data-testid="create-solana-account-button"
        onClick={onAction}
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
