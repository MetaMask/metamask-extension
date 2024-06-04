import React, { useContext, useEffect, useState, KeyboardEvent } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InternalAccount } from '@metamask/keyring-api';
import { Box, ButtonPrimary, ButtonSecondary } from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import { getMetaMaskAccountsOrdered } from '../../../selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Display } from '../../../helpers/constants/design-system';

type CreateAccountOptions = {
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
};

export const CreateAccount = ({
  getNextAvailableAccountName,
  onCreateAccount,
  onActionComplete,
}: CreateAccountOptions) => {
  const t = useI18nContext();

  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const accounts: InternalAccount[] = useSelector(getMetaMaskAccountsOrdered);

  const [defaultAccountName, setDefaultAccountName] = useState('');
  useEffect(() => {
    getNextAvailableAccountName(accounts).then(setDefaultAccountName);
  }, [accounts]);

  const [newAccountName, setNewAccountName] = useState('');
  const trimmedAccountName = newAccountName.trim();

  const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
    accounts,
    { t },
    trimmedAccountName || defaultAccountName,
    defaultAccountName,
  );

  const onSubmit = async (event: KeyboardEvent<HTMLFormElement>) => {
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
  };

  return (
    <Box as="form" onSubmit={onSubmit}>
      <FormTextField
        autoFocus
        id="account-name"
        label={t('accountName')}
        placeholder={defaultAccountName}
        onChange={(e: Event) =>
          setNewAccountName((e.target as HTMLTextAreaElement).value)
        }
        helpText={errorMessage}
        error={!isValidAccountName}
        onKeyPress={(e: KeyboardEvent<HTMLFormElement>) => {
          if (e.key === 'Enter') {
            onSubmit(e);
          }
        }}
      />
      <Box display={Display.Flex} marginTop={6} gap={2}>
        <ButtonSecondary onClick={async () => onActionComplete(false)} block>
          {t('cancel')}
        </ButtonSecondary>
        <ButtonPrimary type="submit" disabled={!isValidAccountName} block>
          {t('create')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};
