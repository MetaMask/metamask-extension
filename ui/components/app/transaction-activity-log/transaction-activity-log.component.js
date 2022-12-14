import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { getValueFromWeiHex } from '../../../helpers/utils/conversions.util';
import { formatDate, getURLHostName } from '../../../helpers/utils/util';
import { EVENT } from '../../../../shared/constants/metametrics';
import TransactionActivityLogIcon from './transaction-activity-log-icon';
import { CONFIRMED_STATUS } from './transaction-activity-log.constants';

export default class TransactionActivityLog extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    activities: PropTypes.array,
    className: PropTypes.string,
    conversionRate: PropTypes.number,
    inlineRetryIndex: PropTypes.number,
    inlineCancelIndex: PropTypes.number,
    nativeCurrency: PropTypes.string,
    onCancel: PropTypes.func,
    onRetry: PropTypes.func,
    primaryTransaction: PropTypes.object,
    isEarliestNonce: PropTypes.bool,
    rpcPrefs: PropTypes.object,
  };

  handleActivityClick = (activity) => {
    const { rpcPrefs } = this.props;
    const etherscanUrl = getBlockExplorerLink(activity, rpcPrefs);

    this.context.trackEvent({
      category: EVENT.CATEGORIES.TRANSACTIONS,
      event: 'Clicked Block Explorer Link',
      properties: {
        link_type: 'Transaction Block Explorer',
        action: 'Activity Details',
        block_explorer_domain: getURLHostName(etherscanUrl),
      },
    });

    global.platform.openTab({ url: etherscanUrl });
  };

  renderInlineRetry(index) {
    const { t } = this.context;
    const {
      inlineRetryIndex,
      primaryTransaction = {},
      onRetry,
      isEarliestNonce,
    } = this.props;
    const { status } = primaryTransaction;

    return isEarliestNonce &&
      status !== CONFIRMED_STATUS &&
      index === inlineRetryIndex ? (
      <div className="transaction-activity-log__action-link" onClick={onRetry}>
        {t('speedUpTransaction')}
      </div>
    ) : null;
  }

  renderInlineCancel(index) {
    const { t } = this.context;
    const {
      inlineCancelIndex,
      primaryTransaction = {},
      onCancel,
      isEarliestNonce,
    } = this.props;
    const { status } = primaryTransaction;

    return isEarliestNonce &&
      status !== CONFIRMED_STATUS &&
      index === inlineCancelIndex ? (
      <div className="transaction-activity-log__action-link" onClick={onCancel}>
        {t('speedUpCancellation')}
      </div>
    ) : null;
  }

  renderActivity(activity, index) {
    const { conversionRate, nativeCurrency } = this.props;
    const { eventKey, value, timestamp } = activity;
    const ethValue = `${getValueFromWeiHex({
      value,
      fromCurrency: 'ETH',
      toCurrency: 'ETH',
      conversionRate,
      numberOfDecimals: 6,
    })} ${nativeCurrency}`;
    const formattedTimestamp = formatDate(timestamp, "T 'on' M/d/y");
    const activityText = this.context.t(eventKey, [
      ethValue,
      formattedTimestamp,
    ]);

    return (
      <div key={index} className="transaction-activity-log__activity">
        <TransactionActivityLogIcon
          className="transaction-activity-log__activity-icon"
          eventKey={eventKey}
        />
        <div className="transaction-activity-log__entry-container">
          <div
            className="transaction-activity-log__activity-text"
            title={activityText}
            onClick={() => this.handleActivityClick(activity)}
          >
            {activityText}
          </div>
          {this.renderInlineRetry(index)}
          {this.renderInlineCancel(index)}
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.context;
    const { className, activities } = this.props;

    if (activities.length === 0) {
      return null;
    }

    return (
      <div className={classnames('transaction-activity-log', className)}>
        <div className="transaction-activity-log__title">
          {t('activityLog')}
        </div>
        <div className="transaction-activity-log__activities-container">
          {activities.map((activity, index) =>
            this.renderActivity(activity, index),
          )}
        </div>
      </div>
    );
  }
}
