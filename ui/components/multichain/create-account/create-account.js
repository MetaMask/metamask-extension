import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  ButtonPrimary,
  ButtonSecondary,
  FormTextField,
  Box,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import { getMetaMaskAccountsOrdered } from '../../../selectors';
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
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const newAccountNumber = Object.keys(accounts).length + 1;
  const defaultAccountName = t('newAccountNumberName', [newAccountNumber]);

  const [newAccountName, setNewAccountName] = useState('');
  const trimmedAccountName = newAccountName.trim();

  const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
    accounts,
    { t },
    trimmedAccountName ?? defaultAccountName,
    defaultAccountName,
  );

  const onCreateAccount = async (name) => {
    const newAccount = await dispatch(addNewAccount(name));
    console.log(newAccount);
    if (name) {
      dispatch(setAccountLabel(newAccount.id, name));
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
  onActionComplete: PropTypes.func.isRequired,
};
