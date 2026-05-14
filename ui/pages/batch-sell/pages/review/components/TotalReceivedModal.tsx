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
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { AssetsReceivedSummaryList } from './AssetsReceivedSummaryList';
import { AssetsReceivedTotalAmountsSummary } from './AssetsReceivedTotalAmountsSummary';

type TotalReceiveModalProps = {
  open: boolean;
  onClose: () => void;
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  receivedAsset: {
    symbol: string;
  };
  totalReceivedAmount?: number;
  minimumReceivedAmount?: number;
};

export const TotalReceivedModal = ({
  open,
  onClose,
  sendAssetsConfig,
  quotes,
  receivedAsset,
  totalReceivedAmount,
  minimumReceivedAmount,
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
          <AssetsReceivedSummaryList
            receivedAsset={receivedAsset}
            sendAssetsConfig={sendAssetsConfig}
            quotes={quotes}
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
