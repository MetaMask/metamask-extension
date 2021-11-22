import React from 'react';
import PropTypes from 'prop-types';

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
}) {
  return (
    <div className="transaction-detail-item">
      <div className="transaction-detail-item__row">
        <Typography
          color={detailTitleColor}
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TYPOGRAPHY.H6}
        >
          {detailTitle}
        </Typography>
        <div className="transaction-detail-item__detail-values">
          {detailText && (
            <Typography variant={TYPOGRAPHY.H6} color={COLORS.UI4}>
              {detailText}
            </Typography>
          )}
          <Typography
            color={COLORS.BLACK}
            fontWeight={FONT_WEIGHT.BOLD}
            variant={TYPOGRAPHY.H6}
            margin={[1, 1]}
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

        <Typography variant={TYPOGRAPHY.H7} color={COLORS.UI4} align="end">
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
};
