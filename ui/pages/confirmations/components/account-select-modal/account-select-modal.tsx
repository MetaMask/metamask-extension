import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';
import { getWalletsWithAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';
import { shortenAddress } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type SelectableAccount = {
  id: string;
  name: string;
  address: string;
};

type SelectableWallet = {
  id: string;
  name: string;
  accounts: SelectableAccount[];
};

export type AccountSelectModalProps = {
  /**
   * The address of the currently selected account, highlighted in the list.
   */
  selectedAddress?: string;
  /**
   * Invoked with the chosen account address when the user picks an account.
   */
  onSelect: (address: string) => void;
  /**
   * Called when the modal requests to close (backdrop, escape, close button, or
   * after an account is selected).
   */
  onClose: () => void;
  /**
   * Optional modal title. Defaults to the "Select an account" string.
   */
  title?: string;
};

/**
 * Modal listing the wallet's EVM accounts, grouped by wallet, and returning the
 * selected account address. Shared across confirmation flows that let the user
 * pick which account funds a transaction.
 *
 * @param props - Component props.
 * @param props.selectedAddress - Address of the currently selected account.
 * @param props.onSelect - Called with the chosen account address.
 * @param props.onClose - Called when the modal should close.
 * @param props.title - Optional modal title.
 */
export function AccountSelectModal({
  selectedAddress = '',
  onSelect,
  onClose,
  title,
}: AccountSelectModalProps) {
  const t = useI18nContext();
  const wallets = useSelector(getWalletsWithAccounts);

  const accountsGroupedByWallet: SelectableWallet[] = useMemo(() => {
    return Object.values(wallets).reduce((acc: SelectableWallet[], wallet) => {
      const accounts: SelectableAccount[] = [];

      Object.values(wallet.groups).forEach((group) => {
        const evmAccount = group.accounts.find((account) =>
          account.type.startsWith('eip155:'),
        );

        if (evmAccount) {
          accounts.push({
            id: group.id,
            name: group.metadata.name,
            address: evmAccount.address,
          });
        }
      });

      if (accounts.length > 0) {
        acc.push({
          id: wallet.id,
          name: wallet.metadata.name,
          accounts,
        });
      }

      return acc;
    }, []);
  }, [wallets]);

  return (
    <Modal isOpen onClose={onClose} data-testid="account-select-modal">
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {title ?? t('selectAnAccount')}
        </ModalHeader>
        <ModalBody className="px-0">
          {accountsGroupedByWallet.map((wallet) => (
            <Box key={wallet.id}>
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
                className="px-4 py-2"
              >
                {wallet.name}
              </Text>
              {wallet.accounts.map((account) => {
                const isSelected =
                  account.address.toLowerCase() ===
                  selectedAddress.toLowerCase();

                return (
                  <Box
                    asChild
                    key={account.id}
                    alignItems={BoxAlignItems.Center}
                    gap={4}
                  >
                    <button
                      type="button"
                      data-testid={`account-select-item-${account.address.toLowerCase()}`}
                      onClick={() => onSelect(account.address)}
                      className="flex w-full cursor-pointer border-0 bg-transparent px-4 py-3 text-left"
                    >
                      <PreferredAvatar
                        address={toChecksumHexAddress(account.address)}
                        size={AvatarAccountSize.Md}
                      />
                      <Box flexDirection={BoxFlexDirection.Column}>
                        <Text
                          variant={TextVariant.BodyMd}
                          fontWeight={
                            isSelected ? FontWeight.Bold : FontWeight.Medium
                          }
                        >
                          {account.name}
                        </Text>
                        <Text
                          variant={TextVariant.BodySm}
                          color={TextColor.TextAlternative}
                        >
                          {shortenAddress(account.address)}
                        </Text>
                      </Box>
                    </button>
                  </Box>
                );
              })}
            </Box>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
