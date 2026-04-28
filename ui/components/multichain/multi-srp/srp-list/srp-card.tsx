import React, { useState, useContext, useCallback } from 'react';
import type { AccountWalletId } from '@metamask/account-api';

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useWalletInfo } from '../../../../hooks/multichain-accounts/useWalletInfo';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSingleWalletAccountsBalanceCallback } from '../../../../hooks/multichain-accounts/useWalletBalance';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

import Card from '../../../ui/card';
import { SrpListItem } from './srp-list-item';

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
  const { trackEvent } = useContext(MetaMetricsContext);
  const { multichainAccounts, keyringId } = useWalletInfo(walletId);
  const [showAccounts, setShowAccounts] = useState<boolean>(false);
  const walletAccountBalance = useSingleWalletAccountsBalanceCallback(walletId);

  const showHideText = useCallback(
    (numberOfAccounts: number): string => {
      if (numberOfAccounts > 1) {
        return showAccounts
          ? t('SrpListHideAccounts', [numberOfAccounts])
          : t('SrpListShowAccounts', [numberOfAccounts]);
      }
      return showAccounts
        ? t('SrpListHideSingleAccount', [numberOfAccounts])
        : t('SrpListShowSingleAccount', [numberOfAccounts]);
    },
    [showAccounts, t],
  );

  return (
    <Card
      key={`srp-${index}-${keyringId}`}
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
        if (keyringId) {
          onActionComplete(keyringId, shouldTriggerBackup);
        }
      }}
      className="select-srp__container"
      marginBottom={3}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
      >
        <Box>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('srpListName', [index + 1])}
          </Text>
          {!hideShowAccounts && (
            <TextButton
              size={TextButtonSize.BodySm}
              color={TextColor.PrimaryDefault}
              className="srp-list__show-accounts"
              data-testid={`srp-list-show-accounts-${index}`}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                trackEvent({
                  category: MetaMetricsEventCategory.Accounts,
                  event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
                  properties: {
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    button_type: 'details',
                  },
                });
                setShowAccounts((prevState) => !prevState);
              }}
            >
              {showHideText(multichainAccounts.length)}
            </TextButton>
          )}
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          {isSettingsPage && (
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={
                shouldTriggerBackup
                  ? TextColor.ErrorDefault
                  : TextColor.TextAlternative
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
                ? IconColor.ErrorDefault
                : IconColor.IconAlternative
            }
          />
        </Box>
      </Box>
      {showAccounts && (
        <Box>
          <Box marginTop={2} marginBottom={2} />
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
