import React from 'react';
import {
  ModalFooter,
  Text,
  TextAlign,
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
import { useBatchSellInfoModal } from '../../../hooks/useBatchSellInfoModal';
import { AssetsReceivedSummaryList } from './AssetsReceivedSummaryList';
import { AssetsReceivedTotalAmountsSummary } from './AssetsReceivedTotalAmountsSummary';

type TotalReceiveModalProps = {
  open: boolean;
  onClose: () => void;
  sentAssets: {
    id: string;
    symbol: string;
    slippagePercent: number;
    receivedAmount: number;
  }[];
  receivedAsset: {
    symbol: string;
  };
  totalReceivedAmount: number;
  minimumReceivedAmount: number;
};

export const TotalReceiveModal = ({
  open,
  onClose,
  sentAssets,
  receivedAsset,
  totalReceivedAmount,
  minimumReceivedAmount,
}: TotalReceiveModalProps) => {
  const t = useI18nContext();
  const { isInfoModalOpen } = useBatchSellInfoModal();

  return (
    <Modal
      isOpen={open && !isInfoModalOpen}
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
          <AssetsReceivedSummaryList
            receivedAsset={receivedAsset}
            sentAssets={sentAssets}
          />
        </ModalBody>
        <ModalFooter>
          <AssetsReceivedTotalAmountsSummary
            minimumReceivedAmount={minimumReceivedAmount}
            totalReceivedAmount={totalReceivedAmount}
            receivedAsset={receivedAsset}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
