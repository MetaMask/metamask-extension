import React, { useContext } from 'react';
import { Button } from '../../../components/component-library';
import { I18nContext } from '../../../contexts/i18n';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';

const AwaitingSignaturesCancelButton = () => {
  const t = useContext(I18nContext);
  const { navigateToBridgePage } = useBridgeNavigation();

  return (
    <Button
      onClick={() => {
        navigateToBridgePage();
      }}
    >
      {t('cancel')}
    </Button>
  );
};

export default AwaitingSignaturesCancelButton;
