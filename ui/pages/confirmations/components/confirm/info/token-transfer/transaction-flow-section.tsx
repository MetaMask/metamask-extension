import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
} from '../../../../../../components/app/confirm/info/row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

export const TransactionFlowSection = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const t = useI18nContext();

  const { value, pending } = useDecodedTransactionData();

  const addresses = value?.data[0].params.filter(
    (param) => param.type === 'address',
  );
  const recipientAddress =
    transactionMeta.type === TransactionType.simpleSend
      ? transactionMeta.txParams.to
      : // sometimes there's more than one address, in which case we want the last one
        addresses?.[addresses.length - 1].value;

  if (pending) {
    return null;
  }

  const { chainId } = transactionMeta;

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
      >
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.SigningInWith}
          label={t('from')}
          ownerId={transactionMeta.id}
        >
          <Box marginTop={1}>
            <ConfirmInfoRowAddress
              address={transactionMeta.txParams.from}
              chainId={chainId}
            />
          </Box>
        </ConfirmInfoAlertRow>

        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconMuted}
        />
        {recipientAddress && (
          <ConfirmInfoRow
            label={t('to')}
            style={{
              flexDirection: 'column',
              alignItems: AlignItems.flexStart,
            }}
          >
            <Box marginTop={1}>
              <ConfirmInfoRowAddress
                address={recipientAddress}
                chainId={chainId}
              />
            </Box>
          </ConfirmInfoRow>
        )}
      </Box>
    </ConfirmInfoSection>
  );
};
