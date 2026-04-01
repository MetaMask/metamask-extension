import { useSelector } from 'react-redux';
import { getQuoteStreamComplete } from '../../../ducks/bridge/selectors';
import { getQuoteStreamReasonString } from '../utils/getQuoteStreamReasonString';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const useBridgeUnavailableQuotesReason = () => {
  const quoteStreamComplete = useSelector(getQuoteStreamComplete);
  const t = useI18nContext();

  return quoteStreamComplete?.reason
    ? t(getQuoteStreamReasonString(quoteStreamComplete.reason))
    : t('noOptionsAvailableMessage');
};
