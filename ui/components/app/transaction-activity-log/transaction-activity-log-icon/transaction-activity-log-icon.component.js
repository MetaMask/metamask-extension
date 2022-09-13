import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  TRANSACTION_CREATED_EVENT,
  TRANSACTION_SUBMITTED_EVENT,
  TRANSACTION_RESUBMITTED_EVENT,
  TRANSACTION_CONFIRMED_EVENT,
  TRANSACTION_DROPPED_EVENT,
  TRANSACTION_ERRORED_EVENT,
  TRANSACTION_CANCEL_ATTEMPTED_EVENT,
  TRANSACTION_CANCEL_SUCCESS_EVENT,
} from '../transaction-activity-log.constants';

export const imageHash = {
  [TRANSACTION_CREATED_EVENT]: 'fa-plus',
  [TRANSACTION_SUBMITTED_EVENT]: 'fa-arrow-up',
  [TRANSACTION_RESUBMITTED_EVENT]: 'fa-retweet',
  [TRANSACTION_CONFIRMED_EVENT]: 'fa-check',
  [TRANSACTION_DROPPED_EVENT]: 'fa-times',
  [TRANSACTION_ERRORED_EVENT]: 'fa-exclamation',
  [TRANSACTION_CANCEL_ATTEMPTED_EVENT]: 'fa-times',
  [TRANSACTION_CANCEL_SUCCESS_EVENT]: 'fa-times',
};

export default class TransactionActivityLogIcon extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    eventKey: PropTypes.oneOf(Object.keys(imageHash)),
  };

  render() {
    const { className, eventKey } = this.props;
    const iconClassName = imageHash[eventKey];

    return (
      <div className={classnames('transaction-activity-log-icon', className)}>
        {iconClassName ? (
          <i
            className={classnames(
              'fa',
              'transaction-activity-log-icon__icon',
              iconClassName,
            )}
          />
        ) : null}
      </div>
    );
  }
}
