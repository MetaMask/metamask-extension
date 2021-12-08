import React, { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import ErrorMessage from '../../ui/error-message';
import I18nValue from '../../ui/i18n-value';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography/typography';

import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { bnGreaterThan } from '../../../helpers/utils/util';
import { useGasFeeContext } from '../../../contexts/gasFee';
import EditGasItem from './edit-gas-item';
import NetworkStatistics from './network-statistics';

const EditGasFeePopover = () => {
  const {
    balanceError,
    estimateUsed,
    editGasMode,
    gasFeeEstimates,
    transaction,
    updateTransactionUsingGasFeeEstimates,
  } = useGasFeeContext();
  const t = useI18nContext();
  const { closeModal, currentModal } = useTransactionModalContext();
  const [marketOptionDisabled, setMarketOptionDisabled] = useState(false);
  const [
    cancelSpeedUpEstimateUpdated,
    setCancelSpeedUpEstimateUpdated,
  ] = useState(false);
  const [
    cancelSpeedUpDefaultEstimate,
    setCancelSpeedUpDefaultEstimate,
  ] = useState();

  useEffect(() => {
    if (
      currentModal !== 'editGasFee' ||
      (editGasMode !== EDIT_GAS_MODES.CANCEL &&
        editGasMode !== EDIT_GAS_MODES.SPEED_UP) ||
      cancelSpeedUpDefaultEstimate
    )
      return;

    let { maxFeePerGas: maxFeePerGasInTransaction } = transaction.txParams;
    maxFeePerGasInTransaction = new BigNumber(
      hexWEIToDecGWEI(maxFeePerGasInTransaction),
    ).times(1.1);
    const maxFeePerGasMedium = gasFeeEstimates.medium.suggestedMaxFeePerGas;
    const gasUsedGreaterThanMedium = bnGreaterThan(
      maxFeePerGasInTransaction,
      maxFeePerGasMedium,
    );
    const maxFeePerGasAggressive = gasFeeEstimates.high.suggestedMaxFeePerGas;
    const gasUsedGreaterThanAggressive = bnGreaterThan(
      maxFeePerGasInTransaction,
      maxFeePerGasAggressive,
    );

    if (
      gasUsedGreaterThanAggressive &&
      editGasMode === EDIT_GAS_MODES.SPEED_UP
    ) {
      updateTransactionUsingGasFeeEstimates(PRIORITY_LEVELS.HIGH);
      setCancelSpeedUpDefaultEstimate(PRIORITY_LEVELS.HIGH);
      setMarketOptionDisabled(true);
    } else if (gasUsedGreaterThanMedium) {
      updateTransactionUsingGasFeeEstimates(PRIORITY_LEVELS.LOW);
      setCancelSpeedUpDefaultEstimate(PRIORITY_LEVELS.LOW);
      setMarketOptionDisabled(true);
    } else {
      updateTransactionUsingGasFeeEstimates(PRIORITY_LEVELS.MEDIUM);
      setCancelSpeedUpDefaultEstimate(PRIORITY_LEVELS.MEDIUM);
    }
  }, [
    currentModal,
    cancelSpeedUpDefaultEstimate,
    editGasMode,
    gasFeeEstimates,
    transaction.txParams,
    updateTransactionUsingGasFeeEstimates,
  ]);

  useEffect(() => {
    if (cancelSpeedUpEstimateUpdated || !cancelSpeedUpDefaultEstimate) return;
    setCancelSpeedUpEstimateUpdated(
      cancelSpeedUpDefaultEstimate === estimateUsed,
    );
  }, [
    cancelSpeedUpDefaultEstimate,
    cancelSpeedUpEstimateUpdated,
    estimateUsed,
  ]);

  if (currentModal !== 'editGasFee') return null;

  let popupTitle = 'editGasFeeModalTitle';
  if (editGasMode === EDIT_GAS_MODES.CANCEL) {
    popupTitle = 'editCancellationGasFeeModalTitle';
  } else if (editGasMode === EDIT_GAS_MODES.SPEED_UP) {
    popupTitle = 'editSpeedUpEditGasFeeModalTitle';
  }

  const estimateIsStale =
    (editGasMode === EDIT_GAS_MODES.CANCEL ||
      editGasMode === EDIT_GAS_MODES.SPEED_UP) &&
    !cancelSpeedUpEstimateUpdated;

  return (
    <Popover
      title={t(popupTitle)}
      onClose={() => closeModal('editGasFee')}
      className="edit-gas-fee-popover"
    >
      <>
        {process.env.IN_TEST ? null : <LoadingHeartBeat />}
        <div className="edit-gas-fee-popover__wrapper">
          <div className="edit-gas-fee-popover__content">
            {balanceError && (
              <ErrorMessage errorKey={INSUFFICIENT_FUNDS_ERROR_KEY} />
            )}
            <div className="edit-gas-fee-popover__content__header">
              <span className="edit-gas-fee-popover__content__header-option">
                <I18nValue messageKey="gasOption" />
              </span>
              <span className="edit-gas-fee-popover__content__header-time">
                {editGasMode !== EDIT_GAS_MODES.SWAPS && (
                  <I18nValue messageKey="time" />
                )}
              </span>
              <span className="edit-gas-fee-popover__content__header-max-fee">
                <I18nValue messageKey="maxFee" />
              </span>
            </div>
            {editGasMode !== EDIT_GAS_MODES.SWAPS && (
              <EditGasItem
                estimateIsStale={estimateIsStale}
                priorityLevel={PRIORITY_LEVELS.LOW}
              />
            )}
            <EditGasItem
              estimateIsStale={estimateIsStale}
              disabled={marketOptionDisabled}
              priorityLevel={PRIORITY_LEVELS.MEDIUM}
            />
            <EditGasItem
              estimateIsStale={estimateIsStale}
              priorityLevel={PRIORITY_LEVELS.HIGH}
            />
            <div className="edit-gas-fee-popover__content__separator" />
            {editGasMode !== EDIT_GAS_MODES.SWAPS && (
              <EditGasItem
                estimateIsStale={estimateIsStale}
                priorityLevel={PRIORITY_LEVELS.DAPP_SUGGESTED}
              />
            )}
            <EditGasItem
              estimateIsStale={estimateIsStale}
              priorityLevel={PRIORITY_LEVELS.CUSTOM}
            />
            <NetworkStatistics />
            <Typography
              className="edit-gas-fee-popover__know-more"
              align="center"
              color={COLORS.UI4}
              tag={TYPOGRAPHY.Paragraph}
              variant={TYPOGRAPHY.H7}
            >
              <I18nValue
                messageKey="learmMoreAboutGas"
                options={[
                  <a
                    key="learnMoreLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://metamask.zendesk.com/hc/en-us/articles/4404600179227-User-Guide-Gas"
                  >
                    <I18nValue messageKey="learnMore" />
                  </a>,
                ]}
              />
            </Typography>
          </div>
        </div>
      </>
    </Popover>
  );
};

export default EditGasFeePopover;
