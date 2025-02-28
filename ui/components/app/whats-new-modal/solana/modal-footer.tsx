import React from 'react';
import {
  ModalFooter as BaseModalFooter,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type ModalFooterProps = {
  onAction: () => void;
  onCancel: () => void;
};

export const SolanaModalFooter = ({
  onAction,
  onCancel,
}: ModalFooterProps) => {
  const t = useI18nContext();

  return (
    <BaseModalFooter paddingTop={4}>
      <Button
        block
        size={ButtonSize.Md}
        variant={ButtonVariant.Primary}
        onClick={() => {
          onAction();
          // TODO: Add create account method call for Solana
        }}
      >
        {t('createSolanaAccount')}
      </Button>
      <Button
        block
        size={ButtonSize.Md}
        variant={ButtonVariant.Link}
        onClick={onCancel}
      >
        {t('notNow')}
      </Button>
    </BaseModalFooter>
  );
};
