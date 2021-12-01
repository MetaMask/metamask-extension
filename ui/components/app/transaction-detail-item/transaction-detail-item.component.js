import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Typography from '../../ui/typography/typography';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';

export default function TransactionDetailItem({
  detailTitle = '',
  detailText = '',
  detailTitleColor = COLORS.BLACK,
  detailTotal = '',
  subTitle = '',
  subText = '',
  boldHeadings = true,
  flexWidthValues = false,
}) {
  return (
    <div className="transaction-detail-item">
      <div className="transaction-detail-item__row">
        <Typography
          color={detailTitleColor}
          fontWeight={boldHeadings ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL}
          variant={TYPOGRAPHY.H6}
          className="transaction-detail-item__title"
        >
          {detailTitle}
        </Typography>
        {detailText && (
          <div
            className={classnames('transaction-detail-item__detail-values', {
              'transaction-detail-item__detail-values--flex-width': flexWidthValues,
            })}
          >
            <Typography
              fontWeight={boldHeadings ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL}
              variant={TYPOGRAPHY.H6}
              className="transaction-detail-item__detail-text"
              color={COLORS.UI4}
            >
              {detailText}
            </Typography>
          </div>
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
        {React.isValidElement(subTitle) ? (
          <div className="transaction-detail-item__subtitle">{subTitle}</div>
        ) : (
          <Typography
            variant={TYPOGRAPHY.H7}
            className="transaction-detail-item__subtitle"
            color={COLORS.UI4}
          >
            {subTitle}
          </Typography>
        )}

        <Typography
          variant={TYPOGRAPHY.H7}
          color={COLORS.UI4}
          className="transaction-detail-item__subtext"
        >
          {subText}
        </Typography>
      </div>
    </div>
  );
}

TransactionDetailItem.propTypes = {
  detailTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  detailTitleColor: PropTypes.string,
  detailText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  detailTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  boldHeadings: PropTypes.bool,
  flexWidthValues: PropTypes.bool,
};
