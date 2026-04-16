import React from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
  TextAlign,
} from '@metamask/design-system-react';

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
import NetworkStatistics from '../../edit-gas-fee-popover/network-statistics/network-statistics';
import { GasModalType } from '../../../constants/gas';
import { useGasOptions } from '../../../hooks/gas/useGasOptions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { GasEstimateListItem } from '../../gas-estimate-list-item/gas-estimate-list-item';
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
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Md}
        data-testid="gas-fee-estimates-modal"
      >
        <ModalHeader onClose={handleCloseModals}>
          {t('editGasFeeModalTitle')}
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={0}
          paddingRight={0}
        >
          {options.map((option) => (
            <GasEstimateListItem key={option.key} option={option} />
          ))}

          <Box>
            <NetworkStatistics useRedesigned />
            <Text
              className="edit-gas-fee-popover__know-more"
              textAlign={TextAlign.Center}
              color={TextColor.TextAlternative}
              variant={TextVariant.BodySm}
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
