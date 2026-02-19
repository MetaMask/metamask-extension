import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../../helpers/constants/design-system';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoRowAddressDisplay } from '../../../../../../components/app/confirm/info/row/address-display';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransferRecipient } from '../hooks/useTransferRecipient';

export const TransactionFlowSection = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const recipientAddress = useTransferRecipient();

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.SigningInWith}
          label={t('from')}
          ownerId={transactionMeta.id}
          style={{ flexDirection: FlexDirection.Column, width: '100%' }}
        >
          <Box marginTop={2} data-testid="sender-address" className="w-full">
            <ConfirmInfoRowAddressDisplay
              address={transactionMeta.txParams.from}
            />
          </Box>
        </ConfirmInfoAlertRow>

        <Box style={{ borderTop: `1px solid var(--color-border-muted)` }}>
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.InteractingWith}
            label={t('to')}
            ownerId={transactionMeta.id}
            style={{ flexDirection: FlexDirection.Column, width: '100%' }}
          >
            <Box
              marginTop={2}
              data-testid="recipient-address"
              className="w-full"
            >
              <ConfirmInfoRowAddressDisplay address={recipientAddress ?? ''} />
            </Box>
          </ConfirmInfoAlertRow>
        </Box>
      </Box>
    </ConfirmInfoSection>
  );
};
