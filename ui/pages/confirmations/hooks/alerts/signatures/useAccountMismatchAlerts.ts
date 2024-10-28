import { useMemo } from 'react';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getConfirmationSender } from '../../../components/confirm/utils';
import { SignatureRequestType } from '../../../types/confirm';
import { isSIWESignatureRequest } from '../../../utils';
import { useConfirmContext } from '../../../context/confirm';

/**
 * This hook returns an array of alerts when the expected address of the request
 * does not match the selected account's address.
 */
export default function useAccountMismatchAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();

  const { from: fromAddress } = getConfirmationSender(currentConfirmation);
  const isSIWE = isSIWESignatureRequest(currentConfirmation);
  const siweParsedAddress =
    currentConfirmation?.msgParams?.siwe?.parsedMessage?.address;
  const isMismatchSIWEAdddress =
    siweParsedAddress?.toLowerCase() !== fromAddress?.toLowerCase();
  const isMismatchAccount = isSIWE && isMismatchSIWEAdddress;

  return useMemo(() => {
    if (!isMismatchAccount) {
      return [];
    }

    return [
      {
        field: RowAlertKey.SigningInWith,
        key: 'signingInWith',
        message: t('alertMessageSignInWrongAccount'),
        reason: t('alertReasonWrongAccount'),
        severity: Severity.Warning,
      },
    ];
  }, [isMismatchAccount, t]);
}
