import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InternalAccount } from '@metamask/keyring-api';
import { KeyringObject, KeyringTypes } from '@metamask/keyring-controller';
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  FormTextFieldSize,
  PolymorphicComponentPropWithRef,
  PolymorphicRef,
} from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/form-text-field';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import {
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
} from '../../../selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Display } from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
import { SelectSRP } from '../multi-srp/select-srp/select-srp';
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
  onSelectSRP: () => void;
  selectedKeyringIndex: number;
  ///: END:ONLY_INCLUDE_IF
};

type CreateAccountProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, Props>;

type CreateAccountComponent = <C extends React.ElementType = 'form'>(
  props: CreateAccountProps<C>,
) => React.ReactElement | null;

export const CreateAccount: CreateAccountComponent = React.memo(
  React.forwardRef(
    <C extends React.ElementType = 'form'>(
      {
        getNextAvailableAccountName,
        onCreateAccount,
        ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
        onSelectSRP,
        selectedKeyringIndex,
        ///: END:ONLY_INCLUDE_IF
        onActionComplete,
      }: CreateAccountProps<C>,
      ref?: PolymorphicRef<C>,
    ) => {
      const t = useI18nContext();

      const history = useHistory();
      const trackEvent = useContext(MetaMetricsContext);

      const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

      const accounts: InternalAccount[] = useSelector(
        getMetaMaskAccountsOrdered,
      );

      const [defaultAccountName, setDefaultAccountName] = useState('');
      // We are not using `accounts` as a dependency here to avoid having the input
      // updating when the new account will be created.
      useEffect(() => {
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
      const keyrings = useSelector(getMetaMaskKeyrings);
      const hdKeyrings = useMemo(
        () =>
          keyrings.filter(
            (keyring: KeyringObject) => keyring.type === KeyringTypes.hd,
          ),
        [keyrings],
      );
      const selectedKeyring = hdKeyrings[selectedKeyringIndex];
      ///: END:ONLY_INCLUDE_IF(multi-srp)

      const onSubmit = useCallback(
        async (event: KeyboardEvent<HTMLFormElement>) => {
          event.preventDefault();

          try {
            await onCreateAccount(trimmedAccountName || defaultAccountName);
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.AccountAdded,
              properties: {
                account_type: MetaMetricsEventAccountType.Default,
                location: 'Home',
              },
            });
            history.push(mostRecentOverviewPage);
          } catch (error) {
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.AccountAddFailed,
              properties: {
                account_type: MetaMetricsEventAccountType.Default,
                error: (error as Error).message,
              },
            });
          }
        },
        [trimmedAccountName, defaultAccountName, mostRecentOverviewPage],
      );

      return (
        <Box as="form" onSubmit={onSubmit}>
          <FormTextField
            ref={ref}
            size={FormTextFieldSize.Lg}
            gap={1}
            autoFocus
            id="account-name"
            label={t('accountName')}
            placeholder={defaultAccountName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewAccountName(e.target.value)
            }
            helpText={errorMessage}
            error={!isValidAccountName}
            onKeyPress={(e: KeyboardEvent<HTMLFormElement>) => {
              if (e.key === 'Enter') {
                onSubmit(e);
              }
            }}
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
            hdKeyrings.length > 1 ? (
              <Box marginBottom={3}>
                <SelectSRP
                  onClick={onSelectSRP}
                  srpName={`Secret Phrase ${selectedKeyringIndex + 1}`}
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
              onClick={async () => await onActionComplete(false)}
              block
            >
              {t('cancel')}
            </ButtonSecondary>
            <ButtonPrimary
              data-testid="submit-add-account-with-name"
              type="submit"
              disabled={!isValidAccountName}
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
