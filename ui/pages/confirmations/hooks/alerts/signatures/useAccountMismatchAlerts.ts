import { useMemo } from 'react';
import { PersonalMessageParams } from '@metamask/message-manager';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getConfirmationSender } from '../../../components/confirm/utils';
import { isSIWESignatureRequest } from '../../../utils';
import { useSignatureRequest } from '../../signatures/useSignatureRequest';

/**
 * This hook returns an array of alerts when the expected address of the request
 * does not match the selected account's address.
 */
export default function useAccountMismatchAlerts(): Alert[] {
  const t = useI18nContext();
  const currentConfirmation = useSignatureRequest();

  const { from: fromAddress } = getConfirmationSender(
    undefined,
    currentConfirmation,
  );
  const isSIWE = isSIWESignatureRequest(currentConfirmation);
  const msgParams = currentConfirmation?.msgParams as PersonalMessageParams;
  const siweParsedAddress = msgParams?.siwe?.parsedMessage?.address;
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
