import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from '../../components/ui/button';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { getAccountNameErrorMessage } from '../../helpers/utils/accounts';
import { Input } from '../../components/component-library';

export default class NewAccountCreateForm extends Component {
  static defaultProps = {
    newAccountNumber: 0,
  };

  state = {
    newAccountName: '',
    defaultAccountName: this.context.t('newAccountNumberName', [
      this.props.newAccountNumber,
    ]),
  };

  render() {
    const { newAccountName, defaultAccountName } = this.state;
    const {
      history,
      createAccount,
      mostRecentOverviewPage,
      accounts,
      onCreateClick,
    } = this.props;

    const createClick = (event) => {
      event.preventDefault();
      createAccount(newAccountName || defaultAccountName)
        .then(() => {
          this.context.trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.AccountAdded,
            properties: {
              account_type: MetaMetricsEventAccountType.Default,
              location: 'Home',
            },
          });
          onCreateClick?.();
          history.push(mostRecentOverviewPage);
        })
        .catch((e) => {
          this.context.trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.AccountAddFailed,
            properties: {
              account_type: MetaMetricsEventAccountType.Default,
              error: e.message,
            },
          });
        });
    };

    const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
      accounts,
      this.context,
      newAccountName,
      defaultAccountName,
    );

    return (
      <div className="new-account-create-form">
        <div className="new-account-create-form__input-label">
          {this.context.t('accountName')}
        </div>
        <div>
          <Input
            className={classnames('new-account-create-form__input', {
              'new-account-create-form__input__error': !isValidAccountName,
            })}
            value={newAccountName}
            placeholder={defaultAccountName}
            onChange={(event) =>
              this.setState({ newAccountName: event.target.value })
            }
            autoFocus
          />
          <div className="new-account-create-form__error new-account-create-form__error-amount">
            {errorMessage}
          </div>
          <div className="new-account-create-form__buttons">
            <Button
              type="secondary"
              large
              className="new-account-create-form__button"
              onClick={() => history.push(mostRecentOverviewPage)}
            >
              {this.context.t('cancel')}
            </Button>
            <Button
              type="primary"
              large
              className="new-account-create-form__button"
              onClick={createClick}
              disabled={!isValidAccountName}
            >
              {this.context.t('create')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

NewAccountCreateForm.propTypes = {
  createAccount: PropTypes.func,
  newAccountNumber: PropTypes.number,
  history: PropTypes.object,
  mostRecentOverviewPage: PropTypes.string.isRequired,
  accounts: PropTypes.array,
  onCreateClick: PropTypes.func,
};

NewAccountCreateForm.contextTypes = {
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};
