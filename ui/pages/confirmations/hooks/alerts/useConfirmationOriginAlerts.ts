import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import punycode from 'punycode/punycode';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../selectors';
import { isSignatureTransactionType } from '../../utils';

const useConfirmationOriginAlerts = (): Alert[] => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as Record<string, any>;

  return useMemo<Alert[]>((): Alert[] => {
    if (
      !currentConfirmation
    ) {
      return [];
    }

    const origin = isSignatureTransactionType(currentConfirmation)
      ? currentConfirmation.msgParams.origin
      : currentConfirmation.txParams.origin;

    // if (origin === punycode.toASCII(origin)) {
    //   return [];
    // }

    return [
      {
        key: 'originSpecialCharacterWarning',
        reason: 'title',
        field: 'originSpecialCharacterWarning',
        severity: Severity.Warning,
        message: t('networkUrlErrorWarning', [punycode.toASCII(origin)]),
      },
    ];
  }, [currentConfirmation, t]);
};

export default useConfirmationOriginAlerts;
