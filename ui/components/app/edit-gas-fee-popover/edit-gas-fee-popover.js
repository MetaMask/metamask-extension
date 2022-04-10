import React from 'react';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Box from '../../ui/box';
import ErrorMessage from '../../ui/error-message';
import I18nValue from '../../ui/i18n-value';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography/typography';

import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { useGasFeeContext } from '../../../contexts/gasFee';
import AppLoadingSpinner from '../app-loading-spinner';
import EditGasItem from './edit-gas-item';
import NetworkStatistics from './network-statistics';

const EditGasFeePopover = () => {
  const { balanceError, editGasMode } = useGasFeeContext();
  const t = useI18nContext();
  const {
    closeAllModals,
    closeModal,
    currentModal,
    openModalCount,
  } = useTransactionModalContext();

  if (currentModal !== 'editGasFee') {
    return null;
  }

  let popupTitle = 'editGasFeeModalTitle';
  if (editGasMode === EDIT_GAS_MODES.CANCEL) {
    popupTitle = 'editCancellationGasFeeModalTitle';
  } else if (editGasMode === EDIT_GAS_MODES.SPEED_UP) {
    popupTitle = 'editSpeedUpEditGasFeeModalTitle';
  }

  return (
    <Popover
      title={t(popupTitle)}
      // below logic ensures that back button is visible only if there are other modals open before this.
      onBack={
        openModalCount === 1 ? undefined : () => closeModal(['editGasFee'])
      }
      onClose={closeAllModals}
      className="edit-gas-fee-popover"
    >
      <>
        <AppLoadingSpinner />
        <div className="edit-gas-fee-popover__wrapper">
          <div className="edit-gas-fee-popover__content">
            <Box>
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
              {(editGasMode === EDIT_GAS_MODES.CANCEL ||
                editGasMode === EDIT_GAS_MODES.SPEED_UP) && (
                <EditGasItem
                  priorityLevel={PRIORITY_LEVELS.TEN_PERCENT_INCREASED}
                />
              )}
              {editGasMode === EDIT_GAS_MODES.MODIFY_IN_PLACE && (
                <EditGasItem priorityLevel={PRIORITY_LEVELS.LOW} />
              )}
              <EditGasItem priorityLevel={PRIORITY_LEVELS.MEDIUM} />
              <EditGasItem priorityLevel={PRIORITY_LEVELS.HIGH} />
              <div className="edit-gas-fee-popover__content__separator" />
              {editGasMode === EDIT_GAS_MODES.MODIFY_IN_PLACE && (
                <EditGasItem priorityLevel={PRIORITY_LEVELS.DAPP_SUGGESTED} />
              )}
              <EditGasItem priorityLevel={PRIORITY_LEVELS.CUSTOM} />
            </Box>
            <Box>
              <NetworkStatistics />
              <Typography
                className="edit-gas-fee-popover__know-more"
                align="center"
                color={COLORS.TEXT_ALTERNATIVE}
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
            </Box>
          </div>
        </div>
      </>
    </Popover>
  );
};

export default EditGasFeePopover;
