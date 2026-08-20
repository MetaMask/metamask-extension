import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxBorderColor,
  Icon,
  IconName,
  IconSize,
  Text,
} from '@metamask/design-system-react';
import type { Hex } from '@metamask/utils';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoAlertRow } from '../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { setAccountOverride } from '../../../../../store/controller-actions/transaction-pay-controller';
import {
  selectTransactionPayAccountOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../../selectors/transactionPayController';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useDisplayName } from '../../../../../hooks/useDisplayName';
import { useConfirmContext } from '../../../context/confirm';
import { AccountSelectModal } from '../../account-select-modal';

export { ConfirmInfoRowSize };

type FromAccountRowProps = {
  /**
   * When true, renders a divider below the row, separating the account selector
   * from the "Pay with" row.
   */
  showDivider?: boolean;
  variant?: ConfirmInfoRowSize;
};

/**
 * "From <wallet>" account selector row.
 *
 * Displays the account currently funding the transaction and lets the user
 * switch to another EVM account via a modal. Selecting an account updates the
 * TransactionPayController's `accountOverride`. The displayed account is
 * `accountOverride ?? txParams.from`, matching how the pay controller resolves
 * the funding account.
 *
 * @param props - Component props.
 * @param props.showDivider - Whether to render a divider below the row.
 * @param props.variant - Row size variant.
 */
export function FromAccountRow({
  showDivider = false,
  variant = ConfirmInfoRowSize.Small,
}: FromAccountRowProps) {
  const t = useI18nContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const txFrom = currentConfirmation?.txParams?.from ?? '';
  const { chainId, id: ownerId } = currentConfirmation ?? {};

  const accountOverride = useSelector((state: TransactionPayState) =>
    selectTransactionPayAccountOverrideByTransactionId(state, transactionId),
  );

  // Prefer the pay-controller override so the pill updates when the user picks
  // a different funding account without mutating txParams.from.
  const from = accountOverride ?? txFrom;

  const { name: fromName, subtitle: fromWalletName } = useDisplayName({
    value: toChecksumHexAddress(from),
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: true,
    variation: chainId as string,
  });

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleSelect = useCallback(
    (address: string) => {
      closeModal();

      if (
        currentConfirmation?.id &&
        address.toLowerCase() !== from.toLowerCase()
      ) {
        // The TransactionPayController resolves the funding account (and gas)
        // from `accountOverride ?? txParams.from`, so keep it in sync with the
        // newly selected account.
        setAccountOverride(currentConfirmation.id, address as Hex).catch(
          (error) => {
            console.error('Failed to set pay account override', error);
          },
        );
      }
    },
    [closeModal, currentConfirmation?.id, from],
  );

  if (!currentConfirmation || !from) {
    return null;
  }

  const label = fromWalletName ? `${t('from')} ${fromWalletName}` : t('from');

  return (
    <>
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.SigningInWith}
        ownerId={ownerId ?? ''}
        data-testid="from-account-row"
        label={label}
        rowVariant={variant}
      >
        <Box
          data-testid="from-account-pill"
          onClick={openModal}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="inline-flex cursor-pointer"
        >
          <PreferredAvatar
            address={toChecksumHexAddress(from)}
            size={AvatarAccountSize.Xs}
          />
          <Text data-testid="from-account-name">
            {fromName ?? shortenAddress(from)}
          </Text>
          <Icon
            data-testid="from-account-arrow"
            name={IconName.ArrowDown}
            size={IconSize.Sm}
          />
        </Box>
      </ConfirmInfoAlertRow>

      {showDivider && (
        <Box
          data-testid="from-account-divider"
          marginTop={1}
          marginBottom={1}
          borderColor={BoxBorderColor.BorderMuted}
          className="border-t"
        />
      )}

      {isModalOpen && (
        <AccountSelectModal
          selectedAddress={from}
          onSelect={handleSelect}
          onClose={closeModal}
        />
      )}
    </>
  );
}
