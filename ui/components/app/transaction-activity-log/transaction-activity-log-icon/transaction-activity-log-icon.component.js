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
import { Icon, ICON_NAMES, ICON_SIZES } from '../../../component-library';
import { Color } from '../../../../helpers/constants/design-system';

export const ACTIVITY_ICONS = {
  [TRANSACTION_CREATED_EVENT]: ICON_NAMES.ADD,
  [TRANSACTION_SUBMITTED_EVENT]: ICON_NAMES.ARROW_UP,
  [TRANSACTION_RESUBMITTED_EVENT]: ICON_NAMES.PROGRAMMING_ARROWS,
  [TRANSACTION_CONFIRMED_EVENT]: ICON_NAMES.CHECK,
  [TRANSACTION_DROPPED_EVENT]: ICON_NAMES.CLOSE,
  [TRANSACTION_ERRORED_EVENT]: ICON_NAMES.DANGER,
  [TRANSACTION_CANCEL_ATTEMPTED_EVENT]: ICON_NAMES.CLOSE,
  [TRANSACTION_CANCEL_SUCCESS_EVENT]: ICON_NAMES.CLOSE,
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
          <Icon name={icon} color={Color.iconDefault} size={ICON_SIZES.SM} />
        ) : null}
      </div>
    );
  }
}
