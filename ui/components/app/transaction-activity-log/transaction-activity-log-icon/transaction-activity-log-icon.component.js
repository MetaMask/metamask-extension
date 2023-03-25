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
import { Icon, IconName, IconSize } from '../../../component-library';
import { Color } from '../../../../helpers/constants/design-system';

export const ACTIVITY_ICONS = {
  [TRANSACTION_CREATED_EVENT]: IconName.Add,
  [TRANSACTION_SUBMITTED_EVENT]: IconName.ArrowUp,
  [TRANSACTION_RESUBMITTED_EVENT]: IconName.ProgrammingArrows,
  [TRANSACTION_CONFIRMED_EVENT]: IconName.Check,
  [TRANSACTION_DROPPED_EVENT]: IconName.Close,
  [TRANSACTION_ERRORED_EVENT]: IconName.Danger,
  [TRANSACTION_CANCEL_ATTEMPTED_EVENT]: IconName.Close,
  [TRANSACTION_CANCEL_SUCCESS_EVENT]: IconName.Close,
};

export default class TransactionActivityLogIcon extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    eventKey: PropTypes.oneOf(Object.keys(ACTIVITY_ICONS)),
  };

  render() {
    const { className, eventKey } = this.props;
    const icon = ACTIVITY_ICONS[eventKey];

    return (
      <div className={classnames('transaction-activity-log-icon', className)}>
        {icon ? (
          <Icon name={icon} color={Color.iconDefault} size={IconSize.Sm} />
        ) : null}
      </div>
    );
  }
}
