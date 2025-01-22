import { TransactionMeta } from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConfirmAlertModal } from '../../../../../components/app/alert-system/confirm-alert-modal';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  doesAddressRequireLedgerHidConnection,
  getCustomNonceValue,
} from '../../../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useMMIConfirmations } from '../../../../../hooks/useMMIConfirmations';
import { getNoteToTraderMessage } from '../../../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
import useAlerts from '../../../../../hooks/useAlerts';
import {
  rejectPendingApproval,
  resolvePendingApproval,
  setNextNonce,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  updateAndApproveTx,
  ///: END:ONLY_INCLUDE_IF
  updateCustomNonce,
} from '../../../../../store/actions';
import { isSignatureTransactionType } from '../../../utils';
import { useConfirmContext } from '../../../context/confirm';
import { getConfirmationSender } from '../utils';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';

export type OnCancelHandler = ({
  location,
}: {
  location: MetaMetricsEventLocation;
}) => void;

function reviewAlertButtonText(
  unconfirmedDangerAlerts: Alert[],
  t: ReturnType<typeof useI18nContext>,
) {
  if (unconfirmedDangerAlerts.length === 1) {
    return t('reviewAlert');
  }

  if (unconfirmedDangerAlerts.length > 1) {
    return t('reviewAlerts');
  }

  return t('confirm');
}

function getButtonDisabledState(
  hasUnconfirmedDangerAlerts: boolean,
  hasBlockingAlerts: boolean,
  disabled: boolean,
) {
  if (hasBlockingAlerts) {
    return true;
  }

  if (hasUnconfirmedDangerAlerts) {
    return false;
  }

  return disabled;
}

const ConfirmButton = ({
  alertOwnerId = '',
  disabled,
  onSubmit,
  onCancel,
}: {
  alertOwnerId?: string;
  disabled: boolean;
  onSubmit: () => void;
  onCancel: OnCancelHandler;
}) => {
  const t = useI18nContext();

  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);

  const {
    alerts,
    hasDangerAlerts,
    hasUnconfirmedDangerAlerts,
    hasUnconfirmedFieldDangerAlerts,
    unconfirmedFieldDangerAlerts,
  } = useAlerts(alertOwnerId);

  const hasDangerBlockingAlerts = alerts.some(
    (alert) => alert.severity === Severity.Danger && alert.isBlocking,
  );

  const handleCloseConfirmModal = useCallback(() => {
    setConfirmModalVisible(false);
  }, []);

  const handleOpenConfirmModal = useCallback(() => {
    setConfirmModalVisible(true);
  }, []);

  return (
    <>
      {confirmModalVisible && (
        <ConfirmAlertModal
          ownerId={alertOwnerId}
          onClose={handleCloseConfirmModal}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
      {hasDangerAlerts ? (
        <Button
          block
          danger
          data-testid="confirm-footer-button"
          disabled={getButtonDisabledState(
            hasUnconfirmedDangerAlerts,
            hasDangerBlockingAlerts,
            disabled,
          )}
          onClick={handleOpenConfirmModal}
          size={ButtonSize.Lg}
          startIconName={
            hasUnconfirmedFieldDangerAlerts
              ? IconName.SecuritySearch
              : IconName.Danger
          }
        >
          {reviewAlertButtonText(unconfirmedFieldDangerAlerts, t)}
        </Button>
      ) : (
        <Button
          block
          data-testid="confirm-footer-button"
          disabled={disabled}
          onClick={onSubmit}
          size={ButtonSize.Lg}
        >
          {t('confirm')}
        </Button>
      )}
    </>
  );
};

const Footer = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const customNonceValue = useSelector(getCustomNonceValue);

  const { currentConfirmation, isScrollToBottomCompleted } =
    useConfirmContext();
  const { from } = getConfirmationSender(currentConfirmation);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const noteToTraderMessage = useSelector(getNoteToTraderMessage);
  const { mmiOnTransactionCallback, mmiOnSignCallback, mmiSubmitDisabled } =
    useMMIConfirmations();
  ///: END:ONLY_INCLUDE_IF

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const isSignature = isSignatureTransactionType(currentConfirmation);

  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) ||
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    mmiSubmitDisabled ||
    ///: END:ONLY_INCLUDE_IF
    hardwareWalletRequiresConnection;

  const onCancel = useCallback(
    ({ location }: { location?: MetaMetricsEventLocation }) => {
      if (!currentConfirmation) {
        return;
      }

      const error = providerErrors.userRejectedRequest();
      error.data = { location };

      dispatch(
        rejectPendingApproval(currentConfirmation.id, serializeError(error)),
      );
      dispatch(updateCustomNonce(''));
      dispatch(setNextNonce(''));
    },
    [currentConfirmation],
  );

  const onSubmit = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }

    const isTransactionConfirmation = isCorrectDeveloperTransactionType(
      currentConfirmation?.type,
    );

    if (isTransactionConfirmation) {
      const mergeTxDataWithNonce = (transactionData: TransactionMeta) =>
        customNonceValue
          ? {
              ...transactionData,
              customNonceValue,
            }
          : transactionData;

      const updatedTx = mergeTxDataWithNonce(
        currentConfirmation as TransactionMeta,
      );

      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      mmiOnTransactionCallback(updatedTx, noteToTraderMessage);
      ///: END:ONLY_INCLUDE_IF

      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      dispatch(updateAndApproveTx(updatedTx, true, ''));
      ///: END:ONLY_INCLUDE_IF
    } else {
      dispatch(resolvePendingApproval(currentConfirmation.id, undefined));

      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      mmiOnSignCallback();
      ///: END:ONLY_INCLUDE_IF
    }
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
  }, [
    currentConfirmation,
    customNonceValue,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    noteToTraderMessage,
    ///: END:ONLY_INCLUDE_IF
  ]);

  const onFooterCancel = useCallback(() => {
    onCancel({ location: MetaMetricsEventLocation.Confirmation });
  }, [currentConfirmation, onCancel]);

  return (
    <PageFooter className="confirm-footer_page-footer">
      <Button
        block
        data-testid="confirm-footer-cancel-button"
        onClick={onFooterCancel}
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
      >
        {t('cancel')}
      </Button>
      <ConfirmButton
        alertOwnerId={currentConfirmation?.id}
        onSubmit={() => onSubmit()}
        disabled={isConfirmDisabled}
        onCancel={onCancel}
      />
    </PageFooter>
  );
};

export default Footer;
