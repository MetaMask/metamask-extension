import React from 'react';
import {
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../components/component-library';
import NetworkStatistics from '../../edit-gas-fee-popover/network-statistics/network-statistics';
import { GasModalType } from '../../../constants/gas';
import { useGasOptions } from '../../../hooks/gas/useGasOptions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import {
  GasEstimateListHeader,
  GasEstimateListItem,
} from '../../gas-estimate-list-item/gas-estimate-list-item';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';

export const EstimatesModal = ({
  setActiveModal,
  handleCloseModals,
}: {
  setActiveModal: (modal: GasModalType) => void;
  handleCloseModals: () => void;
}) => {
  const t = useI18nContext();
  const { options } = useGasOptions({
    handleCloseModals,
    setActiveModal,
  });

  return (
    <Modal isOpen onClose={handleCloseModals}>
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={handleCloseModals}>
          {t('editGasFeeModalTitle')}
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={0}
          paddingRight={0}
        >
          <GasEstimateListHeader />
          {options.map((option) => (
            <GasEstimateListItem key={option.key} option={option} />
          ))}

          <Box>
            <NetworkStatistics useRedesigned />
            <Text
              className="edit-gas-fee-popover__know-more"
              textAlign={TextAlign.Center}
              color={TextColor.textAlternative}
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
