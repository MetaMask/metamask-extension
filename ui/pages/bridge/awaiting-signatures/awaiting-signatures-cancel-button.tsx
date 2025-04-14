// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { Button } from '../../../components/component-library';
import { I18nContext } from '../../../contexts/i18n';

const AwaitingSignaturesCancelButton = () => {
  const t = useContext(I18nContext);
  const history = useHistory();

  return (
    <Button
      onClick={() => {
        history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      }}
    >
      {t('cancel')}
    </Button>
  );
};

export default AwaitingSignaturesCancelButton;
