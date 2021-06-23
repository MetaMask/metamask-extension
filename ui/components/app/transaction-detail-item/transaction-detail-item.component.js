import React from 'react';
import PropTypes from 'prop-types';

import Typography from '../../ui/typography/typography';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';

export default function TransactionDetailItem({
  detailTitle,
  detailText,
  detailTotal,
  subTitle,
  subText,
}) {
  return (
    <div className="transaction-detail-item">
      <div className="transaction-detail-item__row">
        <Typography
          color={COLORS.BLACK}
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TYPOGRAPHY.H6}
          className="transaction-detail-item__title"
        >
          {detailTitle}
        </Typography>
        {detailText && (
          <Typography className="transaction-detail-item__detail-text">
            {detailText}
          </Typography>
        )}
        <Typography
          color={COLORS.BLACK}
          fontWeight={FONT_WEIGHT.BOLD}
          className="transaction-detail-item__total"
        >
          {detailTotal}
        </Typography>
      </div>
      <div className="transaction-detail-item__row">
        {subTitle && (
          <Typography
            variant={TYPOGRAPHY.H7}
            className="transaction-detail-item__subtitle"
          >
            {subTitle}
          </Typography>
        )}
        <Typography variant={TYPOGRAPHY.H7}>{subText}</Typography>
      </div>
    </div>
  );
}

TransactionDetailItem.propTypes = {
  detailTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  detailText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  detailTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

TransactionDetailItem.defaultProps = {
  detailTitle: '',
  detailText: '',
  detailTotal: '',
  subTitle: '',
  subText: '',
};
