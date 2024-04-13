import React, { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethErrors, serializeError } from 'eth-rpc-errors';

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useMMIConfirmations } from '../../../../../hooks/useMMIConfirmations';
///: END:ONLY_INCLUDE_IF
import { doesAddressRequireLedgerHidConnection } from '../../../../../selectors';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../../../store/actions';
import { confirmSelector } from '../../../selectors';

const Footer = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const confirm = useSelector(confirmSelector);
  const { currentConfirmation, isScrollToBottomNeeded } = confirm;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const { mmiOnSignCallback, mmiSubmitDisabled } = useMMIConfirmations();
  ///: END:ONLY_INCLUDE_IF

  let from: string | undefined;
  // todo: extend to other confirmation types
  if (currentConfirmation?.msgParams) {
    from = currentConfirmation.msgParams.from;
  }
  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const dispatch = useDispatch();

  function trackSignEvent(event: MetaMetricsEventName) {
    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event,
      properties: {
        action: 'Sign Request',
        type: currentConfirmation?.type,
        version: currentConfirmation?.msgParams?.version,
        ui_customizations: [
          MetaMetricsEventUiCustomization.RedesignedConfirmation,
        ],
      },
    });
  }

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

    trackSignEvent(MetaMetricsEventName.Cancel);
  }, [currentConfirmation]);

  const onSubmit = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }
    dispatch(resolvePendingApproval(currentConfirmation.id, undefined));
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    mmiOnSignCallback();
    ///: END:ONLY_INCLUDE_IF

    trackSignEvent(MetaMetricsEventName.Confirm);
  }, [currentConfirmation]);

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
