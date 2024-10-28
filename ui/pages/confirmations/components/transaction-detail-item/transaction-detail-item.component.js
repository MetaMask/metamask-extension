import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  Color,
  TextAlign,
  TextVariant,
  Display,
  FlexWrap,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../../components/component-library';

export default function TransactionDetailItem({
  'data-testid': dataTestId,
  detailTitle = '',
  detailText,
  detailTotal = '',
  hasDetailTextInSeparateRow = false,
  subTitle = '',
  subText = '',
  flexWidthValues = false,
  ...props
}) {
  return (
    <div
      className="transaction-detail-item"
      data-testid={dataTestId}
      {...props}
    >
      <div className="transaction-detail-item__row">
        <Text
          as="h6"
          display={Display.Flex}
          flexWrap={FlexWrap.NoWrap}
          paddingBottom={1}
          variant={TextVariant.bodyMdMedium}
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
            <Text
              as="h6"
              color={Color.textAlternative}
              width={hasDetailTextInSeparateRow ? BlockSize.Full : null}
            >
              {detailText}
            </Text>
          )}
          <Text
            as="h6"
            color={Color.textDefault}
            marginLeft={1}
            textAlign={TextAlign.Right}
            variant={TextVariant.bodyMd}
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
            color={Color.textMuted}
            style={{ flex: '1 0 auto' }}
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
   * Text to show on the left of the detailTotal. Wrapped in Typography component.
   */
  detailText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Total amount to show. Wrapped in Typography component.
   */
  detailTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * If true, separates detailText and detailTotal into separate rows
   */
  hasDetailTextInSeparateRow: PropTypes.bool,
  /**
   * Subtitle text. Checks if React.isValidElement before displaying. Displays under detailTitle
   */
  subTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Text to show under detailTotal. Wrapped in Typography component.
   */
  subText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Changes width to auto for transaction-detail-item__detail-values
   */
  flexWidthValues: PropTypes.bool,
};
