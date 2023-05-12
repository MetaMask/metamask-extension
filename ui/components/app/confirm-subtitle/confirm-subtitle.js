import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { SECONDARY } from '../../../helpers/constants/common';
import { Text } from '../../component-library';
import {
  Color,
  FONT_WEIGHT,
  TextVariant,
} from '../../../helpers/constants/design-system';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { getShouldShowFiat } from '../../../selectors';
import { useTransactionInfo } from '../../../hooks/useTransactionInfo';

const ConfirmSubTitle = ({
  txData,
  hexTransactionAmount,
  subtitleComponent,
}) => {
  const shouldShowFiat = useSelector(getShouldShowFiat);
  const { isNftTransfer } = useTransactionInfo(txData);
  // eslint-disable-next-line no-debugger
  debugger;
  if (!shouldShowFiat && !isNftTransfer) {
    return null;
  }

  if (subtitleComponent) {
    return subtitleComponent;
  }

  return (
    <Text
      as="h5"
      ellipsis
      fontWeight={FONT_WEIGHT.NORMAL}
      variant={TextVariant.bodyMd}
      color={Color.textAlternative}
    >
      <UserPreferencedCurrencyDisplay
        value={hexTransactionAmount}
        type={SECONDARY}
        showEthLogo
        hideLabel
      />
    </Text>
  );
};

ConfirmSubTitle.propTypes = {
  hexTransactionAmount: PropTypes.string,
  subtitleComponent: PropTypes.element,
  txData: PropTypes.object.isRequired,
};

export default ConfirmSubTitle;
