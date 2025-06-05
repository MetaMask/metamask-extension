import React, { useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
import { getMetaMaskAccounts } from '../../../../selectors/selectors';
import { InternalAccountWithBalance } from '../../../../selectors/selectors.types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useHdKeyringsWithSnapAccounts } from '../../../../hooks/multi-srp/useHdKeyringsWithSnapAccounts';
import { SrpListItem } from './srp-list-item';

export const SrpList = ({
  onActionComplete,
  hideShowAccounts,
  isSettingsPage = false,
  seedPhraseBackedUp,
}: {
  onActionComplete: (id: string, triggerBackup?: boolean) => void;
  isSettingsPage?: boolean;
  hideShowAccounts?: boolean;
  seedPhraseBackedUp?: boolean;
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const hdKeyringsWithSnapAccounts = useHdKeyringsWithSnapAccounts();

  // This selector will return accounts with nonEVM balances as well.
  const accountsWithBalances: Record<string, InternalAccountWithBalance> =
    useSelector(getMetaMaskAccounts);

  const showAccountsInitState = useMemo(
    () => new Array(hdKeyringsWithSnapAccounts.length).fill(hideShowAccounts),
    [hdKeyringsWithSnapAccounts, hideShowAccounts],
  );

  const [showAccounts, setShowAccounts] = useState<boolean[]>(
    showAccountsInitState,
  );

  const showHideText = (index: number, numberOfAccounts: number): string => {
    if (numberOfAccounts > 1) {
      return showAccounts[index]
        ? t('SrpListHideAccounts', [numberOfAccounts])
        : t('SrpListShowAccounts', [numberOfAccounts]);
    }
    return showAccounts[index]
      ? t('SrpListHideSingleAccount', [numberOfAccounts])
      : t('SrpListShowSingleAccount', [numberOfAccounts]);
  };

  const handleShowHideClick = (event: React.MouseEvent, index: number) => {
    event.stopPropagation();
    trackEvent({
      category: MetaMetricsEventCategory.Accounts,
      event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
      properties: {
        button_type: 'details',
      },
    });
    const showHideStates = hdKeyringsWithSnapAccounts.map((_, i) =>
      i === index ? !showAccounts[i] : showAccounts[i],
    );
    setShowAccounts(showHideStates);
  };

  return (
    <Box
      className="srp-list__container"
      padding={isSettingsPage ? 0 : 4}
      data-testid="srp-list"
    >
      {hdKeyringsWithSnapAccounts.map((keyring, index) => (
        <Card
          key={`srp-${keyring.metadata.id}`}
          data-testid={`hd-keyring-${keyring.metadata.id}`}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
              properties: {
                button_type: 'srp_select',
              },
            });
            const triggerBackup = !seedPhraseBackedUp && index === 0;
            onActionComplete(keyring.metadata.id, triggerBackup);
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
                  onClick={(event: React.MouseEvent) =>
                    handleShowHideClick(event, index)
                  }
                >
                  {showHideText(index, keyring.accounts.length)}
                </Text>
              )}
            </Box>
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
              {isSettingsPage && (
                <Text
                  variant={TextVariant.bodyMdMedium}
                  color={
                    !seedPhraseBackedUp && index === 0
                      ? TextColor.errorDefault
                      : TextColor.textAlternative
                  }
                >
                  {!seedPhraseBackedUp && index === 0
                    ? t('srpListStateNotBackedUp')
                    : t('srpListStateBackedUp')}
                </Text>
              )}
              <Icon
                name={IconName.ArrowRight}
                size={IconSize.Sm}
                color={
                  !seedPhraseBackedUp && index === 0 && isSettingsPage
                    ? IconColor.errorDefault
                    : IconColor.iconAlternative
                }
              />
            </Box>
          </Box>
          {showAccounts[index] && (
            <Box>
              <Box
                width={BlockSize.Full}
                className="srp-list__divider"
                marginTop={2}
                marginBottom={2}
              />
              {keyring.accounts.map((address: string) => {
                const account = accountsWithBalances[address];
                return (
                  <SrpListItem
                    key={`account-${account.id}`}
                    account={account}
                  />
                );
              })}
            </Box>
          )}
        </Card>
      ))}
    </Box>
  );
};
