import React from 'react';

import { useDispatch } from 'react-redux';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { rejectPendingApproval } from '../../../../../store/actions';
import useCurrentConfirmation from '../../../hooks/useCurrentConfirmation';

const Footer = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useCurrentConfirmation();
  const dispatch = useDispatch();

  return (
    <PageFooter>
      <Button
        block
        data-testid="confirm-footer-cancel-button"
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        onClick={() => {
          dispatch(
            rejectPendingApproval(
              currentConfirmation?.id as string,
              serializeError(ethErrors.provider.userRejectedRequest()),
            ),
          );
        }}
      >
        {t('cancel')}
      </Button>
      <Button
        size={ButtonSize.Lg}
        block
        data-testid="confirm-footer-confirm-button"
      >
        {t('confirm')}
      </Button>
    </PageFooter>
  );
};

export default Footer;
