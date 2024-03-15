import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethErrors, serializeError } from 'eth-rpc-errors';

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { confirmSelector } from '../../../../../selectors/confirm';

const Footer = () => {
  const t = useI18nContext();
  const confirm = useSelector(confirmSelector);
  const { currentConfirmation, isScrollToBottomNeeded } = confirm;
  const dispatch = useDispatch();

  const onCancel = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }
    dispatch(
      rejectPendingApproval(
        currentConfirmation.id,
        serializeError(ethErrors.provider.userRejectedRequest()),
      ),
    );
  }, [currentConfirmation]);

  const onSubmit = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }
    dispatch(resolvePendingApproval(currentConfirmation.id, undefined));
  }, [currentConfirmation]);

  return (
    <PageFooter>
      <Button
        block
        onClick={onCancel}
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
      >
        {t('cancel')}
      </Button>
      <Button
        size={ButtonSize.Lg}
        block
        data-testid="confirm-footer-confirm-button"
        disabled={isScrollToBottomNeeded}
        onClick={onSubmit}
      >
        {t('confirm')}
      </Button>
    </PageFooter>
  );
};

export default Footer;
