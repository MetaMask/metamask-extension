'use no memo';

import React, { useMemo } from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import {
  BackgroundColor,
  Severity,
} from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AddressPoisoningAlertContent } from '../../../components/send/address-poisoning-alert-content/address-poisoning-alert-content';
import { useTransferRecipient } from '../../../components/confirm/info/hooks/useTransferRecipient';
import { useAddressPoisoningDetection } from '../../send/useAddressPoisoningDetection';
import { AlertsName } from '../constants';

export function useAddressPoisoningAlert(): Alert[] {
  const t = useI18nContext();
  const recipient = useTransferRecipient();
  const { isPoisoningSuspect, bestMatch } =
    useAddressPoisoningDetection(recipient);

  return useMemo(() => {
    if (!recipient || !isPoisoningSuspect || !bestMatch) {
      return [];
    }

    return [
      {
        key: AlertsName.AddressPoisoning,
        field: RowAlertKey.InteractingWith,
        reason: t('addressPoisoningTitle'),
        content: (
          <Box>
            <Text variant={TextVariant.BodyMd}>
              {t('addressPoisoningMessage')}
            </Text>
            <Box marginTop={2}>
              <AddressPoisoningAlertContent
                address={recipient}
                knownAddress={bestMatch.knownAddress}
                diffIndices={bestMatch.diffIndices}
              />
            </Box>
          </Box>
        ),
        inlineAlertText: t('addressPoisoningBadge'),
        inlineAlertTextPill: true,
        inlineAlertTextBackgroundColor: BackgroundColor.errorMuted,
        severity: Severity.Danger,
        showArrow: true,
        isBlocking: false,
      },
    ];
  }, [bestMatch, isPoisoningSuspect, recipient, t]);
}
