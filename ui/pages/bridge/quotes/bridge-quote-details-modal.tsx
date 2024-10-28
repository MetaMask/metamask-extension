import React from 'react';
import {
  Box,
  Button,
  ModalContent,
  ModalHeader,
  Text,
} from '../../../components/component-library';
import { Footer } from '../../../components/multichain/pages/page';
import {
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { QuoteMetadata, QuoteResponse } from '../types';
import { QuoteInfoRow } from './quote-info-row';

export const BridgeQuoteDetailsModal = ({
  onBack,
  onSelect,
  expandedQuote,
}: {
  onBack: () => void;
  onSelect: () => void;
  expandedQuote: QuoteResponse & QuoteMetadata;
}) => {
  const t = useI18nContext();

  const {
    quote,
    estimatedProcessingTimeInSeconds,
    swapRate,
    sentAmount,
    totalNetworkFee,
    toTokenAmount,
  } = expandedQuote;

  return (
    <ModalContent modalDialogProps={{ padding: 0 }}>
      <ModalHeader onBack={onBack}>
        <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
          {t('swapQuoteDetails')}
        </Text>
      </ModalHeader>
      <Box className="quotes-modal__quote-details">
        <div className="quote-detail-group">
          <QuoteInfoRow label={t('source')} description={quote.bridges[0]} />
          <QuoteInfoRow label={t('quoteRate')} description={`${swapRate}`} />
          <QuoteInfoRow
            label={t('estimatedTime')}
            description={`${estimatedProcessingTimeInSeconds}`}
          />
        </div>
        <hr />
        <div className="quote-detail-group">
          <QuoteInfoRow label={t('swapAmount')} description={`${sentAmount}`} />
          <QuoteInfoRow
            label={t('includedFees')}
            description={'MM fee'}
            tooltipText="tooltip"
          />
          <QuoteInfoRow
            label={t('networkFee')}
            description={`${totalNetworkFee}`}
            tooltipText="tooltip"
          />
          <QuoteInfoRow
            label={t('totalPaid')}
            description={'sentAmount + networkFee'}
          />
        </div>
        <hr />
        <div className="quote-detail-group">
          <QuoteInfoRow
            label={t('totalReceived')}
            description={`${toTokenAmount}`}
          />
        </div>
      </Box>
      <Footer>
        <Button
          className="quotes-modal__quote-details__use-quote-button"
          data-testid="use-quote-button"
          onClick={onSelect}
          disabled={false}
        >
          {t('bridgeUseQuote')}
        </Button>
      </Footer>
    </ModalContent>
  );
};
