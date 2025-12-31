import React, { useState, useContext, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { AccountWalletId } from '@metamask/account-api';

import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useWalletInfo } from '../../../../hooks/multichain-accounts/useWalletInfo';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  useSingleWalletAccountsBalanceCallback,
} from '../../../../hooks/multichain-accounts/useWalletBalance';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

import Card from '../../../ui/card';
import {
  Box,
  IconName,
  Icon,
  Text,
  IconSize,
} from '../../../component-library';
import {
  JustifyContent,
  Display,
  TextColor,
  FlexDirection,
  AlignItems,
  BlockSize,
  TextVariant,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { SrpListItem } from '../srp-list';

/**
 * Props for the SrpCard component.
 */
type SrpCardProps = {
  index: number;
  walletId: AccountWalletId;
  shouldTriggerBackup: boolean;
  onActionComplete: (id: string, triggerBackup?: boolean) => void;
  isSettingsPage?: boolean;
  hideShowAccounts?: boolean;
};

export const SrpCard = ({
  index,
  walletId,
  shouldTriggerBackup,
  onActionComplete,
  isSettingsPage = false,
  hideShowAccounts = false,
}: SrpCardProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { multichainAccounts, keyringId, isSRPBackedUp } =
    useWalletInfo(walletId);
  const [showAccounts, setShowAccounts] = useState<boolean>(false);
  const walletAccountBalance = useSingleWalletAccountsBalanceCallback(walletId);

  const showHideText = useCallback((index: number, numberOfAccounts: number): string => {
    if (numberOfAccounts > 1) {
      return showAccounts
        ? t('SrpListHideAccounts', [numberOfAccounts])
        : t('SrpListShowAccounts', [numberOfAccounts]);
    }
    return showAccounts
      ? t('SrpListHideSingleAccount', [numberOfAccounts])
      : t('SrpListShowSingleAccount', [numberOfAccounts]);
  }, [showAccounts, t]);

  return (
    <Card
      key={`srp-${keyringId}`}
      data-testid={`hd-keyring-${keyringId}`}
      onClick={() => {
        trackEvent({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            button_type: 'srp_select',
          },
        });
        keyringId && onActionComplete(keyringId, shouldTriggerBackup);
      }}
      className="select-srp__container"
      marginBottom={3}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Box>
          <Text variant={TextVariant.bodyMdMedium}>
            {t('srpListName', [index + 1])}
          </Text>
          {!hideShowAccounts && (
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.primaryDefault}
              className="srp-list__show-accounts"
              data-testid={`srp-list-show-accounts-${index}`}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                trackEvent({
                  category: MetaMetricsEventCategory.Accounts,
                  event:
                    MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
                  properties: {
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    button_type: 'details',
                  },
                });
                setShowAccounts((prevState) => !prevState);
              }}
            >
              {showHideText(index, multichainAccounts.length)}
            </Text>
          )}
        </Box>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={1}
        >
          {isSettingsPage && (
            <Text
              variant={TextVariant.bodyMdMedium}
              color={
                shouldTriggerBackup
                  ? TextColor.errorDefault
                  : TextColor.textAlternative
              }
            >
              {shouldTriggerBackup
                ? t('srpListStateNotBackedUp')
                : t('srpListStateBackedUp')}
            </Text>
          )}
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={
              shouldTriggerBackup && isSettingsPage
                ? IconColor.errorDefault
                : IconColor.iconAlternative
            }
          />
        </Box>
      </Box>
      {showAccounts && (
        <Box>
          <Box
            width={BlockSize.Full}
            className="srp-list__divider"
            marginTop={2}
            marginBottom={2}
          />
          {multichainAccounts.map((group) => {
            return (
              <SrpListItem
                key={`account-${group.id}`}
                accountId={group.id}
                accountName={group.metadata.name}
                balance={walletAccountBalance(group.id) ?? ''}
              />
            );
          })}
        </Box>
      )}
    </Card>
  );
};
