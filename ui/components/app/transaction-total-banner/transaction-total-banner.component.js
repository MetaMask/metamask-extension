import React from 'react';
import PropTypes from 'prop-types';

import Typography from '../../ui/typography/typography';
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';

export default function TransactionTotalBanner({ total, detail, timing }) {
  return (
    <div className="transaction-total-banner">
      <Typography color={COLORS.BLACK} variant={TYPOGRAPHY.H1}>
        {total}
      </Typography>
      {detail && (
        <Typography
          color={COLORS.BLACK}
          variant={TYPOGRAPHY.H6}
          className="transaction-total-banner__detail"
        >
          {detail}
        </Typography>
      )}
      {timing && (
        <Typography
          color={COLORS.UI4}
          variant={TYPOGRAPHY.H7}
          className="transaction-total-banner__timing"
        >
          {timing}
        </Typography>
      )}
    </div>
  );
}

TransactionTotalBanner.propTypes = {
  total: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  detail: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  timing: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

TransactionTotalBanner.defaultProps = {
  total: '',
  detail: '',
  timing: '',
};
