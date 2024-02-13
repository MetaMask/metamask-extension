import React from 'react';
import PropTypes from 'prop-types';

import { TransactionType } from '@metamask/transaction-controller';
import { PRIMARY } from '../../../../helpers/constants/common';
import { Text } from '../../../../components/component-library';
import {
  FONT_WEIGHT,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';

const ConfirmTitle = ({ title, hexTransactionAmount, txData }) => {
  const isContractInteraction =
    txData.type === TransactionType.contractInteraction;

  const hideTitle =
    (isContractInteraction || txData.type === TransactionType.deployContract) &&
    txData.txParams?.value === '0x0';

  if (hideTitle) {
    return null;
  }

  if (title) {
    return (
      <Text
        as={title && title.length < 10 ? 'h1' : 'h3'}
        ellipsis
        title={title}
        variant={
          title && title.length < 10
            ? TextVariant.displayMd
            : TextVariant.headingMd
        }
        fontWeight={FONT_WEIGHT.NORMAL}
      >
        {title}
      </Text>
    );
  }

  return (
    <Text
      as="h3"
      ellipsis
      fontWeight={FONT_WEIGHT.NORMAL}
      variant={TextVariant.headingMd}
    >
      <UserPreferencedCurrencyDisplay
        ethLogoHeight={24}
        hideLabel={!isContractInteraction}
        showCurrencySuffix={isContractInteraction}
        showEthLogo
        type={PRIMARY}
        value={hexTransactionAmount}
      />
    </Text>
  );
};

ConfirmTitle.propTypes = {
  txData: PropTypes.object.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hexTransactionAmount: PropTypes.string,
};

export default ConfirmTitle;
