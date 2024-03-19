import { ethErrors, serializeError } from 'eth-rpc-errors';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useMMIConfirmationInfo } from '../../../../../hooks/useMMIConfirmations';
import { doesAddressRequireLedgerHidConnection } from '../../../../../selectors';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../../../store/actions';
import { currentConfirmationSelector } from '../../../selectors';

const Footer = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const { mmiOnSignCallback, mmiSubmitDisabled } = useMMIConfirmationInfo();
  ///: END:ONLY_INCLUDE_IF

  let from: string | undefined;
  // todo: extend to other confirmation types
  if (currentConfirmation?.msgParams) {
    from = currentConfirmation?.msgParams?.from;
  }
  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    mmiOnSignCallback();
    ///: END:ONLY_INCLUDE_IF
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
        block
        onClick={onSubmit}
        size={ButtonSize.Lg}
        disabled={
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          mmiSubmitDisabled ||
          ///: END:ONLY_INCLUDE_IF
          hardwareWalletRequiresConnection
        }
      >
        {t('confirm')}
      </Button>
    </PageFooter>
  );
};

export default Footer;
