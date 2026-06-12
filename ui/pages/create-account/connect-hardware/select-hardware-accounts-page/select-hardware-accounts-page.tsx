import React, { useCallback } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Content,
  Footer,
  Page,
} from '../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { HardwareAccountCard } from '../../../../components/multichain-accounts/hardware-account-card';
import type { SelectHardwareAccountsPageProps } from './select-hardware-accounts-page.types';

/**
 * Lets the user select hardware wallet accounts to import.
 * @param options0
 * @param options0.accounts
 * @param options0.selectedAccountIds
 * @param options0.onAccountSelectionChange
 * @param options0.onBack
 * @param options0.onShowMore
 * @param options0.onContinue
 * @param options0.onForgetDevice
 * @param options0.hasMoreAccounts
 * @param options0.isLoadingMore
 * @param options0.onSettingsClick
 * @param options0.showSettingsButton
 */
export const SelectHardwareAccountsPage = ({
  accounts,
  selectedAccountIds,
  onAccountSelectionChange,
  onBack,
  onShowMore,
  onContinue,
  onForgetDevice,
  hasMoreAccounts = false,
  isLoadingMore = false,
  onSettingsClick,
  showSettingsButton = Boolean(onSettingsClick),
}: SelectHardwareAccountsPageProps) => {
  const t = useI18nContext();

  const handleToggleSelection = useCallback(
    (accountId: string) => {
      const isSelected = selectedAccountIds.includes(accountId);
      const nextSelectedAccountIds = isSelected
        ? selectedAccountIds.filter((id) => id !== accountId)
        : [...selectedAccountIds, accountId];

      onAccountSelectionChange(nextSelectedAccountIds);
    },
    [onAccountSelectionChange, selectedAccountIds],
  );

  const handleContinue = useCallback(() => {
    onContinue(selectedAccountIds);
  }, [onContinue, selectedAccountIds]);

  const isContinueDisabled = selectedAccountIds.length === 0;

  return (
    <Page className="mx-auto w-full max-w-[460px] sm:max-w-[520px]">
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="min-h-14 px-1 py-2"
      >
        <ButtonIcon
          size={ButtonIconSize.Md}
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back') as string}
          onClick={onBack}
          data-testid="select-hardware-accounts-page-back-button"
        />
        {showSettingsButton && onSettingsClick ? (
          <ButtonIcon
            size={ButtonIconSize.Md}
            iconName={IconName.Setting}
            ariaLabel={t('settings') as string}
            onClick={onSettingsClick}
            data-testid="select-hardware-accounts-page-settings-button"
          />
        ) : (
          <Box className="w-10 shrink-0" />
        )}
      </Box>
      <Content className="flex flex-col gap-6">
        <Text
          variant={TextVariant.HeadingLg}
          className="md:text-s-heading-lg md:leading-s-heading-lg md:tracking-s-heading-lg"
        >
          {t('selectAnAccount')}
        </Text>
        <Box flexDirection={BoxFlexDirection.Column} gap={3} className="w-full">
          {accounts.map((account) => (
            <HardwareAccountCard
              key={account.id}
              account={account}
              isSelected={selectedAccountIds.includes(account.id)}
              onToggleSelection={handleToggleSelection}
            />
          ))}
          {hasMoreAccounts ? (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              isFullWidth
              isLoading={isLoadingMore}
              onClick={onShowMore}
              data-testid="select-hardware-accounts-page-show-more-button"
            >
              {t('showMore')}
            </Button>
          ) : null}
        </Box>
      </Content>
      <Footer>
        <Box flexDirection={BoxFlexDirection.Row} gap={4} className="w-full">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={onForgetDevice}
            data-testid="select-hardware-accounts-page-forget-device-button"
          >
            {t('forgetDevice')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            isDisabled={isContinueDisabled}
            onClick={handleContinue}
            data-testid="select-hardware-accounts-page-continue-button"
          >
            {t('continue')}
          </Button>
        </Box>
      </Footer>
    </Page>
  );
};
