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
import { Footer, Page } from '../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { HardwareAccountCard } from '../../../../components/multichain-accounts/hardware-account-card';
import type { SelectHardwareAccountsPageProps } from './select-hardware-accounts-page.types';

/**
 * Lets the user select hardware wallet accounts to import.
 *
 * @param options - Component props.
 * @param options.accounts - Hardware wallet accounts to display.
 * @param options.selectedAccountIds - Currently selected account card ids.
 * @param options.onAccountSelectionChange - Called when the user changes account selection.
 * @param options.onBack - Called when the user navigates back.
 * @param options.onShowMore - Called when the user requests more accounts.
 * @param options.onContinue - Called when the user confirms account selection.
 * @param options.onForgetDevice - Called when the user disconnects the device.
 * @param options.hasMoreAccounts - Whether the show more button is displayed.
 * @param options.isLoadingMore - Whether a load-more request is in progress.
 * @param options.isContinuing - Whether account import is in progress.
 * @param options.onSettingsClick - Called when the user opens HD path settings.
 * @param options.showSettingsButton - Whether the settings button is displayed.
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
  isContinuing = false,
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

  const isContinueDisabled = selectedAccountIds.length === 0 || isContinuing;

  return (
    <Page className="mx-auto h-full min-h-0 w-full max-w-[460px] overflow-hidden sm:max-w-[520px]">
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="min-h-14 shrink-0 px-1 py-2"
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
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 w-full flex-1 gap-6 overflow-hidden px-4 pb-4"
      >
        <Text
          variant={TextVariant.HeadingLg}
          className="shrink-0 md:text-s-heading-lg md:leading-s-heading-lg md:tracking-s-heading-lg"
          data-testid="select-hardware-accounts-page-title"
        >
          {t('selectAnAccount')}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={3}
          className="min-h-0 w-full flex-1 overflow-y-auto"
          data-testid="select-hardware-accounts-page-accounts-scroll"
        >
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
      </Box>
      <Footer className="shrink-0">
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
            isLoading={isContinuing}
            onClick={onContinue}
            data-testid="select-hardware-accounts-page-continue-button"
          >
            {t('continue')}
          </Button>
        </Box>
      </Footer>
    </Page>
  );
};
