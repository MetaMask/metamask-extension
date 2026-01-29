import React from 'react';

import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import Box from '../../../../components/ui/box';

import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../../helpers/constants/error-keys';
import {
  GasFeeContextProvider,
  useGasFeeContext,
} from '../../../../contexts/gasFee';
import AppLoadingSpinner from '../../../../components/app/app-loading-spinner';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import {
  BannerAlert,
  BannerAlertSeverity,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../../../components/component-library';
import EditGasItem from './edit-gas-item';
import NetworkStatistics from './network-statistics';
import type { TransactionMeta } from '@metamask/transaction-controller';

const EditGasFeePopoverWrapped = () => {
  const { balanceError, editGasMode } = useGasFeeContext();
  const t = useI18nContext();
  const { closeAllModals, closeModal, currentModal, openModalCount } =
    useTransactionModalContext();

  const isOpen = currentModal === 'editGasFee';

  let popupTitle = 'editGasFeeModalTitle';
  if (editGasMode === EditGasModes.cancel) {
    popupTitle = 'editCancellationGasFeeModalTitle';
  } else if (editGasMode === EditGasModes.speedUp) {
    popupTitle = 'editSpeedUpEditGasFeeModalTitle';
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAllModals}
      className="edit-gas-fee-popover"
      isClosedOnOutsideClick
      isClosedOnEscapeKey
    >
      <ModalOverlay onClick={closeAllModals} />
      <ModalContent>
        <ModalHeader
          onClose={closeAllModals}
          onBack={
            openModalCount === 1
              ? undefined
              : () => closeModal(['editGasFee'])
          }
        >
          {t(popupTitle)}
        </ModalHeader>
        <ModalBody className="edit-gas-fee-popover__body">
          <AppLoadingSpinner />
          <div className="edit-gas-fee-popover__wrapper">
            <div className="edit-gas-fee-popover__content">
              <Box>
                {balanceError && (
                  <BannerAlert
                    severity={BannerAlertSeverity.Danger}
                    description={t(INSUFFICIENT_FUNDS_ERROR_KEY)}
                    marginBottom={1}
                  />
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

interface EditGasFeePopoverProps {
  transaction: TransactionMeta;
  editGasMode?: EditGasModes;
}

const EditGasFeePopover = ({
  transaction,
  editGasMode,
}: EditGasFeePopoverProps) => {
  const { currentModal } = useTransactionModalContext();

  if (currentModal !== 'editGasFee') {
    return null;
  }

  return (
    <GasFeeContextProvider transaction={transaction} editGasMode={editGasMode}>
      <EditGasFeePopoverWrapped />
    </GasFeeContextProvider>
  );
};

export default EditGasFeePopover;
