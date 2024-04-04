import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text } from '../../../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCurrentDraftTransaction,
  getBestQuote,
  updateSendQuote,
} from '../../../../../../ducks/send';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { SECOND } from '../../../../../../../shared/constants/time';

const REFRESH_INTERVAL = 30;

/**
 * All the info about the current quote; handles polling and displaying the best quote
 * @returns
 */
export function QuoteCard() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { isSwapQuoteLoading } = useSelector(getCurrentDraftTransaction);

  const bestQuote = useSelector(getBestQuote);

  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (bestQuote) {
      setTimeLeft(REFRESH_INTERVAL);
    } else {
      setTimeLeft(undefined);
    }
  }, [bestQuote]);

  useEffect(() => {
    if (isSwapQuoteLoading || timeLeft === undefined) {
      return;
    }

    if (timeLeft <= 0) {
      dispatch(updateSendQuote());
    }

    const timeout = setTimeout(() => setTimeLeft(timeLeft - 1), SECOND);
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  let infoText = useMemo(() => {
    if (isSwapQuoteLoading) {
      return t('swapFetchingQuotes');
    } else if (bestQuote) {
      return timeLeft ? t('swapNewQuoteIn', [timeLeft]) : undefined;
    }
    return undefined;
  }, [isSwapQuoteLoading, bestQuote, timeLeft]);

  return (
    <Box
      display={Display.Flex}
      paddingBottom={4}
      flexDirection={FlexDirection.Column}
      alignItems={isSwapQuoteLoading ? AlignItems.center : AlignItems.flexStart}
    >
      {infoText && (
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodySm}
          className="countdown-timer"
        >
          {infoText}
        </Text>
      )}
    </Box>
  );
}
