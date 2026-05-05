import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { toChecksumHexAddress } from '../../../../../../../shared/lib/hexstring-utils';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useDisplayName } from '../../../../../../hooks/useDisplayName';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransferRecipient } from '../hooks/useTransferRecipient';
import { AccountFlowRow } from '../../../rows/account-flow-row/account-flow-row';

export const TransactionFlowSection = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const recipientAddress = useTransferRecipient();

  const { chainId } = transactionMeta;
  const fromAddress = transactionMeta.txParams.from;
  const toAddress = recipientAddress ?? '';

  const {
    name: fromName,
    isAccount: fromIsAccount,
    image: fromImage,
    displayState: fromDisplayState,
    subtitle: fromWalletName,
  } = useDisplayName({
    value: toChecksumHexAddress(fromAddress),
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: true,
    variation: chainId,
  });

  const {
    name: toName,
    isAccount: toIsAccount,
    image: toImage,
    displayState: toDisplayState,
    subtitle: toWalletName,
  } = useDisplayName({
    value: toChecksumHexAddress(toAddress),
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: true,
    variation: chainId,
  });

  const fromLabel = fromWalletName
    ? `${t('from')} ${fromWalletName}`
    : t('from');

  const toLabel = toWalletName ? `${t('to')} ${toWalletName}` : t('to');

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      <Box flexDirection={BoxFlexDirection.Column} paddingRight={2}>
        <AccountFlowRow
          address={fromAddress}
          label={fromLabel}
          alertKey={RowAlertKey.SigningInWith}
          name={fromName}
          isAccount={fromIsAccount}
          image={fromImage}
          displayState={fromDisplayState}
          data-testid="sender-address"
        />

        <Box
          style={{
            borderTop: '1px solid var(--color-border-muted)',
          }}
          marginLeft={2}
          marginTop={1}
          marginBottom={1}
        />

        <AccountFlowRow
          address={toAddress}
          label={toLabel}
          alertKey={RowAlertKey.InteractingWith}
          name={toName}
          isAccount={toIsAccount}
          image={toImage}
          displayState={toDisplayState}
          data-testid="recipient-address"
        />
      </Box>
    </ConfirmInfoSection>
  );
};
