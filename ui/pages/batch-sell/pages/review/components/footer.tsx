import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type FooterProps = {
  reviewIsDisabled: boolean;
  onReviewClick: () => void;
  areQuotesRefreshExpired: boolean;
  onGetNewQuotesClick?: () => void;
  quotesAreLoading: boolean;
};

export const Footer = ({
  reviewIsDisabled,
  onReviewClick,
  areQuotesRefreshExpired,
  onGetNewQuotesClick,
  quotesAreLoading,
}: FooterProps) => {
  const t = useI18nContext();
  const reviewButtonLabel = useMemo(() => {
    if (quotesAreLoading) {
      return 'searchingForBestQuotes';
    }

    return areQuotesRefreshExpired ? 'batchSellGetNewQuotes' : 'review';
  }, [quotesAreLoading, areQuotesRefreshExpired]);

  return (
    <Box padding={4}>
      <Button
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        isFullWidth
        onClick={areQuotesRefreshExpired ? onGetNewQuotesClick : onReviewClick}
        disabled={reviewIsDisabled}
      >
        <Text
          variant={TextVariant.ButtonLabelMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
          color={TextColor.PrimaryInverse}
        >
          {t(reviewButtonLabel)}
        </Text>
      </Button>
    </Box>
  );
};
