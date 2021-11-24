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
        >
          {detailTitle}
        </Typography>
        <div
          className={classnames('transaction-detail-item__detail-values', {
            'transaction-detail-item__detail-values--flex-width': flexWidthValues,
          })}
        >
          {detailText && (
            <Typography variant={TYPOGRAPHY.H6} color={COLORS.UI4}>
              {detailText}
            </Typography>
          )}
          <Typography
            color={COLORS.BLACK}
            fontWeight={boldHeadings ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL}
            variant={TYPOGRAPHY.H6}
            margin={[1, 0, 1, 1]}
          >
            {detailTotal}
          </Typography>
        </div>
      </div>
      <div className="transaction-detail-item__row">
        {React.isValidElement(subTitle) ? (
          <div>{subTitle}</div>
        ) : (
          <Typography variant={TYPOGRAPHY.H7} color={COLORS.UI4}>
            {subTitle}
          </Typography>
        )}

        <Typography
          variant={TYPOGRAPHY.H7}
          color={COLORS.UI4}
          align="end"
          className="transaction-detail-item__row-subText"
        >
          {subText}
        </Typography>
      </div>
    </div>
  );
}

TransactionDetailItem.propTypes = {
  /**
   * Show title with text or react child
   */
  detailTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Customize color of the title
   */
  detailTitleColor: PropTypes.string,
  /**
   * Show amount on the left
   */
  detailText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show total amount
   */
  detailTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Add subtitle could be react child or text
   */
  subTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show subtitle text could be react child or text
   */
  subText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  boldHeadings: PropTypes.bool,
  flexWidthValues: PropTypes.bool,
};
