import React, { useMemo } from 'react';
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
import { hasAnyEnabledAsset } from '../utils/hasAnyEnabledAsset';
import { hasAtLeastOneQuoteAvailable } from '../utils/hasAtLeastOneQuoteAvailable';
import { AssetsReceivedSummaryList } from './assets-received-summary-list';
import { AssetsReceivedTotalAmountsSummary } from './assets-received-total-amounts-summary';

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
  quotesAreFetching: boolean;
  atLeastOneQuoteAvailable: boolean;
  anyEnabledAsset: boolean;
};

export const TotalReceivedModal = ({
  open,
  onClose,
  sendAssetsConfig,
  quotes,
  receivedAsset,
  totalReceivedAmount,
  minimumReceivedAmount,
  quotesAreFetching,
  anyEnabledAsset,
  atLeastOneQuoteAvailable,
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
            isLoading={
              quotesAreFetching && anyEnabledAsset && !atLeastOneQuoteAvailable
            }
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
