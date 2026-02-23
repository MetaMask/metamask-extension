import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { AvatarAccountSize } from '@metamask/design-system-react';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../../../../helpers/constants/design-system';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoRowAddressDisplay } from '../../../../../../components/app/confirm/info/row/address-display';
import { PreferredAvatar } from '../../../../../../components/app/preferred-avatar';
import { toChecksumHexAddress } from '../../../../../../../shared/modules/hexstring-utils';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useDisplayName } from '../../../../../../hooks/useDisplayName';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransferRecipient } from '../hooks/useTransferRecipient';

export const TransactionFlowSection = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const recipientAddress = useTransferRecipient();

  const { chainId } = transactionMeta;
  const fromAddress = transactionMeta.txParams.from;
  const toAddress = recipientAddress ?? '';

  const { subtitle: fromWalletName } = useDisplayName({
    value: toChecksumHexAddress(fromAddress),
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: true,
    variation: chainId,
  });

  const { subtitle: toWalletName } = useDisplayName({
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
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={2}
        >
          <Box style={{ flex: 1, minWidth: 0 }}>
            <ConfirmInfoAlertRow
              alertKey={RowAlertKey.SigningInWith}
              label={fromLabel}
              ownerId={transactionMeta.id}
              style={{ flexDirection: FlexDirection.Column, width: '100%' }}
            >
              <Box
                marginTop={2}
                data-testid="sender-address"
                className="w-full"
              >
                <ConfirmInfoRowAddressDisplay
                  address={fromAddress}
                  showAvatar={false}
                />
              </Box>
            </ConfirmInfoAlertRow>
          </Box>
          <PreferredAvatar
            address={toChecksumHexAddress(fromAddress)}
            size={AvatarAccountSize.Md}
            style={{ flexShrink: 0 }}
          />
        </Box>

        <Box style={{ borderTop: `1px solid var(--color-border-muted)` }}>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={2}
          >
            <Box style={{ flex: 1, minWidth: 0 }}>
              <ConfirmInfoAlertRow
                alertKey={RowAlertKey.InteractingWith}
                label={toLabel}
                ownerId={transactionMeta.id}
                style={{ flexDirection: FlexDirection.Column, width: '100%' }}
              >
                <Box
                  marginTop={2}
                  data-testid="recipient-address"
                  className="w-full"
                >
                  <ConfirmInfoRowAddressDisplay
                    address={toAddress}
                    showAvatar={false}
                  />
                </Box>
              </ConfirmInfoAlertRow>
            </Box>
            <PreferredAvatar
              address={toChecksumHexAddress(toAddress)}
              size={AvatarAccountSize.Md}
              style={{ flexShrink: 0 }}
            />
          </Box>
        </Box>
      </Box>
    </ConfirmInfoSection>
  );
};
