import { ethErrors, serializeError } from 'eth-rpc-errors';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useMMIConfirmations } from '../../../../../hooks/useMMIConfirmations';
///: END:ONLY_INCLUDE_IF

import { doesAddressRequireLedgerHidConnection } from '../../../../../selectors';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../../../store/actions';
import useSignatureSecurityAlertResponse from '../../../hooks/useSignatureSecurityAlertResponse';
import { confirmSelector } from '../../../selectors';
import { SecurityAlertResponse } from '../../../types/confirm';
import { getConfirmationSender } from '../utils';

const Footer = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const confirm = useSelector(confirmSelector);
  const [isDangerButton, setIsDangerButton] = useState(false);

  const { currentConfirmation, isScrollToBottomNeeded } = confirm;
  const { from } = getConfirmationSender(currentConfirmation);

  const currentSecurityAlertId = (
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse
  )?.securityAlertId;

  const signatureSecurityAlertResponse = useSignatureSecurityAlertResponse(
    currentSecurityAlertId,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const { mmiOnSignCallback, mmiSubmitDisabled } = useMMIConfirmations();
  ///: END:ONLY_INCLUDE_IF

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

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

  useEffect(() => {
    setIsDangerButton(
      signatureSecurityAlertResponse?.result_type ===
        BlockaidResultType.Malicious,
    );
  }, [signatureSecurityAlertResponse?.result_type]);

  return (
    <PageFooter className="confirm-footer_page-footer">
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
        data-testid="confirm-footer-confirm-button"
        onClick={onSubmit}
        size={ButtonSize.Lg}
        danger={isDangerButton}
        disabled={
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          mmiSubmitDisabled ||
          ///: END:ONLY_INCLUDE_IF
          isScrollToBottomNeeded ||
          hardwareWalletRequiresConnection
        }
      >
        {t('confirm')}
      </Button>
    </PageFooter>
  );
};

export default Footer;
