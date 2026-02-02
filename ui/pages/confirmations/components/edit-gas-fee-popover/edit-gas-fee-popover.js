import PropTypes from 'prop-types';
import React from 'react';

import {
  Box,
  Text,
  TextButton,
  TextVariant,
  BoxFlexDirection,
  FontWeight,
  TextColor,
  BoxBorderColor,
  TextAlign,
} from '@metamask/design-system-react';
import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';

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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../../../components/component-library';
import EditGasItem from './edit-gas-item';
import NetworkStatistics from './network-statistics';

const EditGasFeePopoverWrapped = () => {
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
    <Modal isOpen onClose={closeAllModals}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={closeAllModals}
          // below logic ensures that back button is visible only if there are other modals open before this.
          onBack={
            openModalCount === 1 ? undefined : () => closeModal(['editGasFee'])
          }
        >
          {t(popupTitle)}
        </ModalHeader>

        <AppLoadingSpinner />
        <ModalBody className="flex flex-col justify-between">
          <Box flexDirection={BoxFlexDirection.Column}>
            {balanceError && (
              <BannerAlert
                severity={BannerAlertSeverity.Danger}
                description={t(INSUFFICIENT_FUNDS_ERROR_KEY)}
                marginBottom={1}
              />
            )}
            <Box flexDirection={BoxFlexDirection.Row} marginHorizontal={3}>
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Bold}
                color={TextColor.TextAlternative}
                className="inline-block w-[36%]"
              >
                {t('gasOption')}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Bold}
                color={TextColor.TextAlternative}
                className="inline-block w-[24%]"
              >
                {editGasMode !== EditGasModes.swaps && t('time')}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Bold}
                color={TextColor.TextAlternative}
                className="inline-block w-[30%]"
              >
                {t('maxFee')}
              </Text>
            </Box>
            {(editGasMode === EditGasModes.cancel ||
              editGasMode === EditGasModes.speedUp) && (
              <EditGasItem priorityLevel={PriorityLevels.tenPercentIncreased} />
            )}
            {editGasMode === EditGasModes.modifyInPlace && (
              <EditGasItem priorityLevel={PriorityLevels.low} />
            )}
            <EditGasItem priorityLevel={PriorityLevels.medium} />
            <EditGasItem priorityLevel={PriorityLevels.high} />
            <Box
              className="border-t"
              borderColor={BoxBorderColor.BorderDefault}
              marginVertical={2}
              marginHorizontal={3}
            />
            {editGasMode === EditGasModes.modifyInPlace && (
              <EditGasItem priorityLevel={PriorityLevels.dAppSuggested} />
            )}
            <EditGasItem priorityLevel={PriorityLevels.custom} />
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} marginTop={9}>
            <NetworkStatistics />
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
            >
              {t('learnMoreAboutGas', [
                <TextButton asChild key="learnMoreLink" className="inline">
                  <a
                    href={ZENDESK_URLS.USER_GUIDE_GAS}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('learnMore')}
                  </a>
                </TextButton>,
              ])}
            </Text>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const EditGasFeePopover = ({ transaction, editGasMode }) => {
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

EditGasFeePopover.propTypes = {
  transaction: PropTypes.object.isRequired,
  editGasMode: PropTypes.string,
};

export default EditGasFeePopover;
