import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class TransactionBreakdownRow extends PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
  };

  render() {
    const { title, children, className } = this.props;

    return (
      <div
        className={classnames('transaction-breakdown-row', className)}
        data-testid="transaction-breakdown-row"
      >
        <div
          className="transaction-breakdown-row__title"
          data-testid="transaction-breakdown-row-title"
        >
          {title}
        </div>
        <div
          className="transaction-breakdown-row__value"
          data-testid="transaction-breakdown-row-value"
        >
          {children}
        </div>
      </div>
    );
  }
}
