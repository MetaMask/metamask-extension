import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  Color,
  FontWeight,
  AlignItems,
  TextAlign,
  TextVariant,
  Display,
  FlexWrap,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../../components/component-library';

export default function TransactionDetailItem({
  'data-testid': dataTestId,
  detailTitle = '',
  detailText,
  detailTitleColor = Color.textDefault,
  detailTotal = '',
  subTitle = '',
  subText = '',
  boldHeadings = true,
  flexWidthValues = false,
}) {
  return (
    <div className="transaction-detail-item" data-testid={dataTestId}>
      <div className="transaction-detail-item__row">
        <Text
          as="h6"
          color={detailTitleColor}
          fontWeight={boldHeadings ? FontWeight.Bold : FontWeight.Normal}
          display={Display.Flex}
          flexWrap={FlexWrap.NoWrap}
          alignItems={AlignItems.center}
        >
          {detailTitle}
        </Text>
        <div
          className={classnames('transaction-detail-item__detail-values', {
            'transaction-detail-item__detail-values--flex-width':
              flexWidthValues,
          })}
        >
          {detailText && (
            <Text as="h6" color={Color.textAlternative}>
              {detailText}
            </Text>
          )}
          <Text
            as="h6"
            color={Color.textDefault}
            fontWeight={boldHeadings ? FontWeight.Bold : FontWeight.Normal}
            marginLeft={1}
            textAlign={TextAlign.Right}
          >
            {detailTotal}
          </Text>
        </div>
      </div>
      <div className="transaction-detail-item__row">
        {React.isValidElement(subTitle) ? (
          <div>{subTitle}</div>
        ) : (
          <Text
            as="h6"
            variant={TextVariant.bodySm}
            color={Color.textAlternative}
          >
            {subTitle}
          </Text>
        )}

        <Text
          as="h6"
          variant={TextVariant.bodySm}
          color={Color.textAlternative}
          textAlign={TextAlign.End}
          className="transaction-detail-item__row-subText"
        >
          {subText}
        </Text>
      </div>
    </div>
  );
}

TransactionDetailItem.propTypes = {
  /**
   * An identifier for use in end-to-end tests.
   */
  'data-testid': PropTypes.string,
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
