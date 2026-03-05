import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import {
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
} from '../../../../../../helpers/constants/design-system';
import { ConfirmInfoRowAddress } from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransferRecipient } from '../hooks/useTransferRecipient';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../../../shared/constants/app';

export const TransactionFlowSection = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const recipientAddress = useTransferRecipient();
  const { chainId } = transactionMeta;

  const environmentType = getEnvironmentType();
  const showFullName =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        paddingBottom={1}
      >
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.SigningInWith}
          label={t('from')}
          ownerId={transactionMeta.id}
          style={{
            flex: 1,
            flexDirection: FlexDirection.Column,
            overflow: 'hidden',
          }}
        >
          <Box marginTop={2} data-testid="sender-address" className="w-full">
            <ConfirmInfoRowAddress
              address={transactionMeta.txParams.from}
              chainId={chainId}
              showFullName={showFullName}
            />
          </Box>
        </ConfirmInfoAlertRow>

        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconAlternative}
        />

        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.InteractingWith}
          label={t('to')}
          ownerId={transactionMeta.id}
          style={{
            flex: 1,
            flexDirection: FlexDirection.Column,
            overflow: 'hidden',
          }}
        >
          <Box marginTop={2} data-testid="recipient-address" className="w-full">
            <ConfirmInfoRowAddress
              address={recipientAddress ?? ''}
              chainId={chainId}
              showFullName={showFullName}
            />
          </Box>
        </ConfirmInfoAlertRow>
      </Box>
    </ConfirmInfoSection>
  );
};
