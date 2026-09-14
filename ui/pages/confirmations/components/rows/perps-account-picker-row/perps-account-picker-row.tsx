import React, { useCallback, useState } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import type { Hex } from '@metamask/utils';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  Icon,
  IconName,
  IconSize,
  Text,
} from '@metamask/design-system-react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
} from '../../../../../components/app/confirm/info/row/row';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useDisplayName } from '../../../../../hooks/useDisplayName';
import { updateEditableParams } from '../../../../../store/actions';
import { useDispatch } from '../../../../../store/hooks';
import { useConfirmContext } from '../../../context/confirm';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../../../hooks/useConfirmationNavigation';
import { AccountSelectModal } from '../../account-select-modal';

/**
 * Destination perps-account picker shown on Money Account → Perps deposits.
 *
 * Selection currently updates `txParams.from`. Balance display and HIP-3
 * sub-account routing are follow-up work.
 */
const PerpsAccountPickerRowContent = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const from = currentConfirmation?.txParams?.from ?? '';
  const { chainId } = currentConfirmation ?? {};

  const { name: fromName } = useDisplayName({
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
        dispatch(
          updateEditableParams(currentConfirmation.id, {
            from: address as Hex,
          }),
        ).catch((error: unknown) => {
          console.error('Failed to update perps deposit destination', error);
        });
      }
    },
    [closeModal, currentConfirmation, dispatch, from],
  );

  if (!currentConfirmation || !from) {
    return null;
  }

  const displayName = `${fromName ?? shortenAddress(from)} (Perps)`;

  return (
    <>
      <ConfirmInfoRow
        data-testid="perps-account-picker-row"
        label={t('to')}
        rowVariant={ConfirmInfoRowSize.Small}
      >
        <Box
          data-testid="perps-account-picker-pill"
          onClick={openModal}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="inline-flex cursor-pointer"
        >
          <PreferredAvatar
            address={toChecksumHexAddress(from)}
            size={AvatarAccountSize.Xs}
          />
          <Text data-testid="perps-account-picker-name">{displayName}</Text>
          <Icon
            data-testid="perps-account-picker-arrow"
            name={IconName.ArrowDown}
            size={IconSize.Sm}
          />
        </Box>
      </ConfirmInfoRow>

      {isModalOpen && (
        <AccountSelectModal
          selectedAddress={from}
          onSelect={handleSelect}
          onClose={closeModal}
          title={t('selectPerpsAccount')}
        />
      )}
    </>
  );
};

export function PerpsAccountPickerRow() {
  const { payWithOption } = useConfirmationNavigationOptions();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isMoneyAccountPerpsDeposit =
    payWithOption === PayWithOption.MoneyAccount &&
    hasTransactionType(currentConfirmation, [TransactionType.perpsDeposit]);

  if (!isMoneyAccountPerpsDeposit) {
    return null;
  }

  return <PerpsAccountPickerRowContent />;
}
