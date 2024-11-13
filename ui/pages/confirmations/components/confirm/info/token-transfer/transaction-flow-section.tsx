import { NameType } from '@metamask/name-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import Name from '../../../../../../components/app/name';
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
import { useConfirmContext } from '../../../../context/confirm';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { ConfirmLoader } from '../shared/confirm-loader/confirm-loader';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

export const TransactionFlowSection = () => {
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
    return <ConfirmLoader />;
  }

  const { chainId } = transactionMeta;

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        padding={1}
      >
        <div>
          <Text
            variant={TextVariant.bodyMdMedium}
            style={{
              marginBottom: 6,
            }}
          >
            From
          </Text>
          <Name
            value={transactionMeta.txParams.from}
            type={NameType.ETHEREUM_ADDRESS}
            variation={chainId}
          />
        </div>
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconMuted}
        />
        <div>
          {recipientAddress && (
            <>
              <ConfirmInfoAlertRow
                alertKey={RowAlertKey.FirstTimeInteraction}
                label={t('to')}
                ownerId={transactionMeta.id}
                style={{
                  padding: 0,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {/* Intentional fragment */}
                <></>
              </ConfirmInfoAlertRow>
              <Name
                value={recipientAddress}
                type={NameType.ETHEREUM_ADDRESS}
                variation={chainId}
              />
            </>
          )}
        </div>
      </Box>
    </ConfirmInfoSection>
  );
};
