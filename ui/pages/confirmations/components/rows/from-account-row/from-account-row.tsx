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
import { replaceAccountInNestedTransactions } from '../../../utils/transaction-pay';
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
    async (address: string) => {
      closeModal();

      if (
        !currentConfirmation?.id ||
        address.toLowerCase() === from.toLowerCase()
      ) {
        return;
      }

      // Rewrite nested calldata first and await persistence so confirm cannot
      // approve a previously funded batch that still transfers to the old
      // recipient, then seed accountOverride.
      try {
        await replaceAccountInNestedTransactions({
          transactionId: currentConfirmation.id,
          nestedTransactions: currentConfirmation.nestedTransactions,
          oldAddress: accountOverride ?? txFrom,
          newAddress: address,
        });
        await setAccountOverride(currentConfirmation.id, address as Hex);
      } catch (error) {
        console.error('Failed to update pay account override', error);
      }
    },
    [accountOverride, closeModal, currentConfirmation, from, txFrom],
  );

  if (!currentConfirmation || !from) {
    return null;
  }

  const label = fromWalletName ? `${t('from')} ${fromWalletName}` : t('from');
  const accountName = fromName ?? shortenAddress(from);

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
          asChild
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="inline-flex min-w-0"
        >
          <button
            type="button"
            data-testid="from-account-pill"
            onClick={openModal}
            aria-label={`${label} ${accountName}`}
            className="inline-flex min-w-0 cursor-pointer items-center border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <PreferredAvatar
              address={toChecksumHexAddress(from)}
              size={AvatarAccountSize.Xs}
            />
            <Text data-testid="from-account-name">{accountName}</Text>
            <Icon
              data-testid="from-account-arrow"
              name={IconName.ArrowDown}
              size={IconSize.Sm}
              aria-hidden
            />
          </button>
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
