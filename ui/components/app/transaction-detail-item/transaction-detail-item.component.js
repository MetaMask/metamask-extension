import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Typography from '../../ui/typography/typography';
import {
  Color,
  FONT_WEIGHT,
  TypographyVariant,
  DISPLAY,
  FLEX_WRAP,
  AlignItems,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

export default function TransactionDetailItem({
  detailTitle = '',
  detailText = '',
  detailTitleColor = Color.textDefault,
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
          variant={TypographyVariant.H6}
          boxProps={{
            display: DISPLAY.FLEX,
            flexWrap: FLEX_WRAP.NO_WRAP,
            alignItems: AlignItems.center,
          }}
        >
          {detailTitle}
        </Typography>
        <div
          className={classnames('transaction-detail-item__detail-values', {
            'transaction-detail-item__detail-values--flex-width':
              flexWidthValues,
          })}
        >
          {detailText && (
            <Typography
              variant={TypographyVariant.H6}
              color={Color.textAlternative}
            >
              {detailText}
            </Typography>
          )}
          <Typography
            color={Color.textDefault}
            fontWeight={boldHeadings ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL}
            variant={TypographyVariant.H6}
            marginTop={1}
            marginBottom={1}
            marginLeft={1}
            boxProps={{ textAlign: TEXT_ALIGN.RIGHT }}
          >
            {detailTotal}
          </Typography>
        </div>
      </div>
      <div className="transaction-detail-item__row">
        {React.isValidElement(subTitle) ? (
          <div>{subTitle}</div>
        ) : (
          <Typography
            variant={TypographyVariant.H7}
            color={Color.textAlternative}
          >
            {subTitle}
          </Typography>
        )}

        <Typography
          variant={TypographyVariant.H7}
          color={Color.textAlternative}
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
   * Detail title text wrapped in Typography component.
   */
  detailTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * The color of the detailTitle text accepts all Typography color props
   */
  detailTitleColor: PropTypes.string,
  /**
   * Text to show on the left of the detailTotal. Wrapped in Typography component.
   */
  detailText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Total amount to show. Wrapped in Typography component. Will be bold if boldHeadings is true
   */
  detailTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Subtitle text. Checks if React.isValidElement before displaying. Displays under detailTitle
   */
  subTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Text to show under detailTotal. Wrapped in Typography component.
   */
  subText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Whether detailTotal is bold or not. Defaults to true
   */
  boldHeadings: PropTypes.bool,
  /**
   * Changes width to auto for transaction-detail-item__detail-values
   */
  flexWidthValues: PropTypes.bool,
};
