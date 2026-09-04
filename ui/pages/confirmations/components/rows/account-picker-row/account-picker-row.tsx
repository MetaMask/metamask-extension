import React, { useCallback, useMemo, useState } from 'react';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextFieldSearch,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
} from '../../../../../components/app/confirm/info/row/row';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type SubAccountBase = {
  id: string;
  name: string;
};

export type AccountPickerTestIds = {
  row: string;
  pill: string;
  name: string;
  arrow: string;
  sheet: string;
  searchInput: string;
  accountItem: string;
};

export type AccountPickerRowContentProps<AccountType extends SubAccountBase> = {
  subAccounts: AccountType[];
  selectedSubAccount: AccountType | null;
  onSelect: (id: string) => void;
  formatBalance: (account: AccountType) => React.ReactNode;
  title: string;
  searchPlaceholder: string;
  testIds: AccountPickerTestIds;
};

/**
 * Confirmation row plus searchable account sheet. Mirrors mobile
 * `AccountPickerRowContent` for Perps (and similar) destination pickers.
 *
 * @param props - Component props.
 * @param props.subAccounts - Accounts listed in the picker.
 * @param props.selectedSubAccount - Currently selected account, or null.
 * @param props.onSelect - Called with the chosen account id.
 * @param props.formatBalance - Renders the trailing balance for a list item.
 * @param props.title - Modal title.
 * @param props.searchPlaceholder - Search field placeholder.
 * @param props.testIds - Test ids for the row, sheet, search, and items.
 */
export function AccountPickerRowContent<AccountType extends SubAccountBase>({
  subAccounts,
  selectedSubAccount,
  onSelect,
  formatBalance,
  title,
  searchPlaceholder,
  testIds,
}: AccountPickerRowContentProps<AccountType>) {
  const t = useI18nContext();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) {
      return subAccounts;
    }

    const query = searchQuery.toLowerCase();
    return subAccounts.filter((account) =>
      account.name.toLowerCase().includes(query),
    );
  }, [searchQuery, subAccounts]);

  const closePicker = useCallback(() => {
    setSearchQuery('');
    setIsPickerVisible(false);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      closePicker();
    },
    [closePicker, onSelect],
  );

  if (subAccounts.length === 0) {
    return null;
  }

  return (
    <>
      <ConfirmInfoRow
        data-testid={testIds.row}
        label={t('to')}
        rowVariant={ConfirmInfoRowSize.Small}
      >
        <Box
          data-testid={testIds.pill}
          onClick={() => setIsPickerVisible(true)}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="inline-flex min-w-0 cursor-pointer"
        >
          {selectedSubAccount ? (
            <>
              <PreferredAvatar
                address={toChecksumHexAddress(selectedSubAccount.id)}
                size={AvatarAccountSize.Xs}
              />
              <Text data-testid={testIds.name} className="truncate">
                {selectedSubAccount.name}
              </Text>
            </>
          ) : (
            <Text color={TextColor.TextAlternative}>{t('to')}</Text>
          )}
          <Icon
            data-testid={testIds.arrow}
            name={IconName.ArrowDown}
            size={IconSize.Sm}
          />
        </Box>
      </ConfirmInfoRow>

      {isPickerVisible && (
        <Modal isOpen onClose={closePicker} data-testid={testIds.sheet}>
          <ModalOverlay />
          <ModalContent size={ModalContentSize.Sm}>
            <ModalHeader
              onClose={closePicker}
              closeButtonProps={{ ariaLabel: t('close') }}
            >
              {title}
            </ModalHeader>
            <ModalBody className="max-h-[70vh] overflow-y-auto px-0">
              <Box paddingLeft={4} paddingRight={4} paddingBottom={2}>
                <TextFieldSearch
                  autoFocus
                  className="w-full"
                  clearButtonOnClick={() => setSearchQuery('')}
                  inputProps={
                    {
                      'data-testid': testIds.searchInput,
                    } as React.ComponentPropsWithoutRef<'input'>
                  }
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                />
              </Box>
              {filteredAccounts.map((account) => {
                const isSelected =
                  account.id.toLowerCase() ===
                  selectedSubAccount?.id.toLowerCase();
                const balanceContent = formatBalance(account);

                return (
                  <Box
                    asChild
                    key={account.id}
                    alignItems={BoxAlignItems.Center}
                    flexDirection={BoxFlexDirection.Row}
                    justifyContent={BoxJustifyContent.Between}
                    gap={4}
                  >
                    <button
                      type="button"
                      data-testid={`${testIds.accountItem}-${account.id}`}
                      onClick={() => handleSelect(account.id)}
                      className="flex w-full cursor-pointer items-center border-0 bg-transparent px-4 py-3 text-left"
                    >
                      <Box
                        alignItems={BoxAlignItems.Center}
                        flexDirection={BoxFlexDirection.Row}
                        gap={4}
                        className="min-w-0"
                      >
                        <PreferredAvatar
                          address={toChecksumHexAddress(account.id)}
                          size={AvatarAccountSize.Md}
                        />
                        <Text
                          variant={TextVariant.BodyMd}
                          fontWeight={
                            isSelected ? FontWeight.Bold : FontWeight.Medium
                          }
                          className="truncate"
                        >
                          {account.name}
                        </Text>
                      </Box>
                      <Box className="shrink-0">
                        {typeof balanceContent === 'string' ? (
                          <Text variant={TextVariant.BodyMd}>
                            {balanceContent}
                          </Text>
                        ) : (
                          balanceContent
                        )}
                      </Box>
                    </button>
                  </Box>
                );
              })}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
