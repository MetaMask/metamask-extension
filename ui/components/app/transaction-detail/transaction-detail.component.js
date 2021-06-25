import React from 'react';
import PropTypes from 'prop-types';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';

export default function TransactionDetail({ rows }) {
  return <div className="transaction-detail">{rows}</div>;
}

TransactionDetail.propTypes = {
  rows: PropTypes.arrayOf(TransactionDetailItem),
};

TransactionDetail.defaultProps = {
  rows: [],
};
