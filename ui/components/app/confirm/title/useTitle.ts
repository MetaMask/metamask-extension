import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../selectors';

// Map transaction type to translation keys
const translationMap: Partial<Record<TransactionType, string>> = {
  [TransactionType.personalSign]: 'confirmTitleSignature',
};

/** Hook to get the title based on the transaction type */
const useTitle = (): string => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

  if (!currentConfirmation) {
    return '';
  }

  const translationKey = translationMap[currentConfirmation.type];
  return t(translationKey);
};

export default useTitle;
