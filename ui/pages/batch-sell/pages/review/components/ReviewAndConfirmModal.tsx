import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  ModalFooter,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AssetsReceivedSummaryList } from './AssetsReceivedSummaryList';
import { AssetsReceivedTotalAmountsSummary } from './AssetsReceivedTotalAmountsSummary';

type TotalReceiveModalProps = {
  open: boolean;
  onClose: () => void;
};

const NetworkFeeRow = () => {
  return null;
};

export const ReviewAndConfirmModal = ({
  open,
  onClose,
}: TotalReceiveModalProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={open}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Text textAlign={TextAlign.Center} variant={TextVariant.HeadingSm}>
            {t('totalReceived')}
          </Text>
        </ModalHeader>
        <ModalBody>
          {/* <Box></Box>
          <AssetsReceivedSummaryList />
          <AssetsReceivedTotalAmountsSummary />
          <NetworkFeeRow /> */}
        </ModalBody>
        <ModalFooter>
          <Button
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            isFullWidth
            onClick={console.log}
            disabled={false}
            isLoading={false}
          >
            <Text
              variant={TextVariant.ButtonLabelMd}
              fontWeight={FontWeight.Medium}
              textAlign={TextAlign.Center}
              color={TextColor.PrimaryInverse}
            >
              {t('submit')}
            </Text>
          </Button>
          <Text>metamask fee disclaimer</Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
