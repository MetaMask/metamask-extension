import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Box, ButtonPrimary, ButtonSecondary } from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import {
  getMetaMaskAccountsOrdered,
  getInternalAccounts,
} from '../../../selectors';
import { addNewAccount, setAccountLabel } from '../../../store/actions';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Display } from '../../../helpers/constants/design-system';

export const CreateAccount = ({ onActionComplete }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const internalAccounts = useSelector(getInternalAccounts);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const newAccountNumber = Object.keys(internalAccounts).length + 1;
  const defaultAccountName = t('newAccountNumberName', [newAccountNumber]);

  const [newAccountName, setNewAccountName] = useState('');
  const trimmedAccountName = newAccountName.trim();

  const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
    accounts,
    { t },
    trimmedAccountName || defaultAccountName,
    defaultAccountName,
  );

  const onCreateAccount = async (name) => {
    const newAccountAddress = await dispatch(addNewAccount());
    if (name) {
      dispatch(setAccountLabel(newAccountAddress, name));
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      await onCreateAccount(trimmedAccountName || defaultAccountName);
      onActionComplete(true);
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
          error: error.message,
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
        onChange={(event) => setNewAccountName(event.target.value)}
        helpText={errorMessage}
        error={!isValidAccountName}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            onSubmit(e);
          }
        }}
      />
      <Box display={Display.Flex} marginTop={6} gap={2}>
        <ButtonSecondary onClick={() => onActionComplete()} block>
          {t('cancel')}
        </ButtonSecondary>
        <ButtonPrimary type="submit" disabled={!isValidAccountName} block>
          {t('create')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

CreateAccount.propTypes = {
  /**
   * Executes when the Create button is clicked
   */
  onActionComplete: PropTypes.func.isRequired,
};
