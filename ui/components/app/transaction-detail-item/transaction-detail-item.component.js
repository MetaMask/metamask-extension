import React from 'react';
import PropTypes from 'prop-types';

import Typography from '../../ui/typography/typography';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Button from '../../ui/button';

export default function TransactionDetailItem({
  detailTitle,
  detailText,
  detailTotal,
  subTitle,
  subText,
  handleActionClick,
  actionText,
}) {
  return (
    <div className="transaction-detail-item">
      {actionText && (
        <div className="transaction-detail-item__row transaction-detail-item__row--action-row">
          <Button
            className="transaction-detail-item__action-button"
            onClick={handleActionClick}
            type="link"
          >
            {actionText}
          </Button>
        </div>
      )}
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
          <Typography
            variant={TYPOGRAPHY.H6}
            className="transaction-detail-item__detail-text"
            color={COLORS.UI4}
          >
            {detailText}
          </Typography>
        )}
        <Typography
          color={COLORS.BLACK}
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TYPOGRAPHY.H6}
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
            color={COLORS.UI4}
          >
            {subTitle}
          </Typography>
        )}
        <Typography variant={TYPOGRAPHY.H7} color={COLORS.UI4}>
          {subText}
        </Typography>
      </div>
    </div>
  );
}

TransactionDetailItem.propTypes = {
  handleActionClick: PropTypes.func,
  actionText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
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
