import type { KeyringTypes } from '@metamask/keyring-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { ChangeEvent, KeyboardEvent } from 'react';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
///: END:ONLY_INCLUDE_IF

import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { Display } from '../../../helpers/constants/design-system';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getMetaMaskAccountsOrdered,
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  getMetaMaskHdKeyrings,
  getSelectedKeyringByIdOrDefault,
  getHdKeyringIndexByIdOrDefault,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import type {
  PolymorphicComponentPropWithRef,
  PolymorphicRef,
} from '../../component-library';
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  FormTextFieldSize,
} from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/form-text-field';

///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
import { SelectSrp } from '../multi-srp/select-srp/select-srp';
///: END:ONLY_INCLUDE_IF

type Props = {
  /**
   * Callback to get the next available account name.
   */
  getNextAvailableAccountName: (accounts: InternalAccount[]) => Promise<string>;

  /**
   * Callback to create the account.
   */
  onCreateAccount: (name: string) => Promise<void>;

  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;

  /**
   * Callback to select the SRP
   */
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  onSelectSrp?: () => void;
  selectedKeyringId?: string;
  ///: END:ONLY_INCLUDE_IF
};

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type CreateAccountProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, Props>;

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type CreateAccountComponent = <C extends React.ElementType = 'form'>(
  props: CreateAccountProps<C>,
) => React.ReactElement | null;

export const CreateAccount: CreateAccountComponent = React.memo(
  React.forwardRef(
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    <C extends React.ElementType = 'form'>(
      {
        getNextAvailableAccountName,
        onCreateAccount,
        ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
        onSelectSrp,
        selectedKeyringId,
        ///: END:ONLY_INCLUDE_IF
        onActionComplete,
      }: CreateAccountProps<C>,
      ref?: PolymorphicRef<C>,
    ) => {
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
      // eslint-disable-next-line id-length
      const t = useI18nContext();

      const history = useHistory();
      const trackEvent = useContext(MetaMetricsContext);
      const hdEntropyIndex = useSelector(getHDEntropyIndex);

      const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

      const accounts: InternalAccount[] = useSelector(
        getMetaMaskAccountsOrdered,
      );

      const [loading, setLoading] = useState(false);
      const [defaultAccountName, setDefaultAccountName] = useState('');
      // We are not using `accounts` as a dependency here to avoid having the input
      // updating when the new account will be created.
      useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
        getNextAvailableAccountName(accounts).then(setDefaultAccountName);
      }, []);

      const [newAccountName, setNewAccountName] = useState('');
      const trimmedAccountName = newAccountName.trim();

      const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
        accounts,
        { t },
        trimmedAccountName || defaultAccountName,
        defaultAccountName,
      );
      ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
      const hdKeyrings: {
        accounts: InternalAccount[];
        type: KeyringTypes;
        metadata: { id: string; name: string };
      }[] = useSelector(getMetaMaskHdKeyrings);

      const selectedKeyring = useSelector((state) =>
        getSelectedKeyringByIdOrDefault(state, selectedKeyringId),
      );
      const selectedHdKeyringIndex = useSelector((state) =>
        getHdKeyringIndexByIdOrDefault(state, selectedKeyringId),
      );
      ///: END:ONLY_INCLUDE_IF(multi-srp)

      const onSubmit = useCallback(
        // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
        // eslint-disable-next-line no-restricted-globals
        async (event: KeyboardEvent<HTMLFormElement>) => {
          setLoading(true);
          event.preventDefault();
          try {
            await onCreateAccount(trimmedAccountName || defaultAccountName);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.AccountAdded,
              properties: {
                // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                account_type: MetaMetricsEventAccountType.Default,
                location: 'Home',
                // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                hd_entropy_index: hdEntropyIndex,
              },
            });
            history.push(mostRecentOverviewPage);
          } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.AccountAddFailed,
              properties: {
                // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                account_type: MetaMetricsEventAccountType.Default,
                error: (error as Error).message,
                // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                hd_entropy_index: hdEntropyIndex,
              },
            });
          }
        },
        [trimmedAccountName, defaultAccountName, mostRecentOverviewPage],
      );

      return (
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
        <Box as="form" onSubmit={onSubmit}>
          <FormTextField
            data-testid="account-name-input"
            ref={ref}
            size={FormTextFieldSize.Lg}
            gap={2}
            autoFocus
            id="account-name"
            label={t('accountName')}
            placeholder={defaultAccountName}
            // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
            // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
            // eslint-disable-next-line id-length, no-restricted-globals
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewAccountName(e.target.value)
            }
            helpText={errorMessage}
            error={!isValidAccountName}
            // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
            // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
            // eslint-disable-next-line id-length, no-restricted-globals
            onKeyPress={(e: KeyboardEvent<HTMLFormElement>) => {
              if (e.key === 'Enter') {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
                onSubmit(e);
              }
            }}
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
            hdKeyrings.length > 1 && onSelectSrp && selectedKeyring ? (
              <Box marginBottom={3}>
                <SelectSrp
                  onClick={onSelectSrp}
                  srpName={t('secretRecoveryPhrasePlusNumber', [
                    selectedHdKeyringIndex + 1,
                  ])}
                  srpAccounts={selectedKeyring.accounts.length}
                />
              </Box>
            ) : null
            ///: END:ONLY_INCLUDE_IF
          }
          <Box display={Display.Flex} marginTop={1} gap={2}>
            <ButtonSecondary
              data-testid="cancel-add-account-with-name"
              type={
                'button' /* needs to be 'button' to prevent submitting form on cancel */
              }
              // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
              onClick={async () => await onActionComplete(false)}
              block
            >
              {t('cancel')}
            </ButtonSecondary>
            <ButtonPrimary
              data-testid="submit-add-account-with-name"
              type="submit"
              disabled={!isValidAccountName || loading}
              loading={loading}
              block
            >
              {t('addAccount')}
            </ButtonPrimary>
          </Box>
        </Box>
      );
    },
  ),
);
