import React from 'react';

import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import Box from '../../../../components/ui/box';
import ErrorMessage from '../../../../components/ui/error-message';
import Popover from '../../../../components/ui/popover';

import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../../helpers/constants/error-keys';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import AppLoadingSpinner from '../../../../components/app/app-loading-spinner';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { Text } from '../../../../components/component-library';
import EditGasItem from './edit-gas-item';
import NetworkStatistics from './network-statistics';

const EditGasFeePopover = () => {
  const { balanceError, editGasMode } = useGasFeeContext();
  const t = useI18nContext();
  const { closeAllModals, closeModal, currentModal, openModalCount } =
    useTransactionModalContext();

  if (currentModal !== 'editGasFee') {
    return null;
  }

  let popupTitle = 'editGasFeeModalTitle';
  if (editGasMode === EditGasModes.cancel) {
    popupTitle = 'editCancellationGasFeeModalTitle';
  } else if (editGasMode === EditGasModes.speedUp) {
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
                  {t('gasOption')}
                </span>
                <span className="edit-gas-fee-popover__content__header-time">
                  {editGasMode !== EditGasModes.swaps && t('time')}
                </span>
                <span className="edit-gas-fee-popover__content__header-max-fee">
                  {t('maxFee')}
                </span>
              </div>
              {(editGasMode === EditGasModes.cancel ||
                editGasMode === EditGasModes.speedUp) && (
                <EditGasItem
                  priorityLevel={PriorityLevels.tenPercentIncreased}
                />
              )}
              {editGasMode === EditGasModes.modifyInPlace && (
                <EditGasItem priorityLevel={PriorityLevels.low} />
              )}
              <EditGasItem priorityLevel={PriorityLevels.medium} />
              <EditGasItem priorityLevel={PriorityLevels.high} />
              <div className="edit-gas-fee-popover__content__separator" />
              {editGasMode === EditGasModes.modifyInPlace && (
                <EditGasItem priorityLevel={PriorityLevels.dAppSuggested} />
              )}
              <EditGasItem priorityLevel={PriorityLevels.custom} />
            </Box>
            <Box>
              <NetworkStatistics />
              <Text
                className="edit-gas-fee-popover__know-more"
                align="center"
                color={TextColor.textAlternative}
                tag={TextVariant.bodyMd}
                variant={TextVariant.bodySm}
                as="h6"
              >
                {t('learnMoreAboutGas', [
                  <a
                    key="learnMoreLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={ZENDESK_URLS.USER_GUIDE_GAS}
                  >
                    {t('learnMore')}
                  </a>,
                ])}
              </Text>
            </Box>
          </div>
        </div>
      </>
    </Popover>
  );
};

export default EditGasFeePopover;
