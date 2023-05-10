import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Button from '../../../ui/button';

interface Props {
  isLocked: boolean;
  onClick: () => void;
}

export function LockAssetButton({ onClick, isLocked }: Props) {
  const t = useI18nContext();

  return (
    <>
      <Button
        type="primary"
        onClick={onClick}
        className="nft-details__send-button"
        data-testid="nft-send-button"
      >
        {isLocked ? t('unlock') : t('lock')}
      </Button>
    </>
  );
}
