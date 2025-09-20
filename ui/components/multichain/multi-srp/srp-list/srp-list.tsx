import React, { useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
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
import { getIsPrimarySeedPhraseBackedUp } from '../../../../ducks/metamask/metamask';
import { SrpListItem } from './srp-list-item';

export const SrpList = ({
  onActionComplete,
  hideShowAccounts,
  isSettingsPage = false,
}: {
  onActionComplete: (id: string, triggerBackup?: boolean) => void;
  isSettingsPage?: boolean;
  hideShowAccounts?: boolean;
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const hdKeyringsWithSnapAccounts = useHdKeyringsWithSnapAccounts();

  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );

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

  return (
    <Box
      className={classnames('srp-list__container', {
        'srp-list__container--settings': isSettingsPage,
      })}
      padding={isSettingsPage ? 0 : 4}
      data-testid="srp-list"
    >
      {hdKeyringsWithSnapAccounts.map((keyring, index) => {
        // We only consider the first(primary) keyring for the backup reminder.
        const shouldTriggerBackup = !isPrimarySeedPhraseBackedUp && index === 0;

        return (
          <Card
            key={`srp-${keyring.metadata.id}`}
            data-testid={`hd-keyring-${keyring.metadata.id}`}
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
              onActionComplete(keyring.metadata.id, shouldTriggerBackup);
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
                      setShowAccounts((prevState) => {
                        const accountListLength =
                          hdKeyringsWithSnapAccounts.length;
                        let newState = prevState;
                        if (accountListLength > prevState.length) {
                          // Extend the state with `false` for new accounts
                          newState = [
                            ...prevState,
                            ...Array(accountListLength - prevState.length).fill(
                              false,
                            ),
                          ];
                        }
                        return newState.map((value, i) =>
                          i === index ? !value : value,
                        );
                      });
                    }}
                  >
                    {showHideText(index, keyring.accounts.length)}
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
        );
      })}
    </Box>
  );
};
