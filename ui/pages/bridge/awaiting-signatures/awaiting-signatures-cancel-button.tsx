import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { Button } from '../../../components/component-library';
import { I18nContext } from '../../../contexts/i18n';

const AwaitingSignaturesCancelButton = () => {
  const t = useContext(I18nContext);
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => {
        navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      }}
    >
      {t('cancel')}
    </Button>
  );
};

export default AwaitingSignaturesCancelButton;
