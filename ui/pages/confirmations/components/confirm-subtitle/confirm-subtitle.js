import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { SECONDARY } from '../../../../helpers/constants/common';
import {
  Color,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { isNFTAssetStandard } from '../../../../helpers/utils/transactions.util';
import { getShouldShowFiat } from '../../../../selectors';
import { useTransactionInfo } from '../../hooks/useTransactionInfo';
import { Text } from '../../../../components/component-library';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { useHideFiatForTestnet } from '../../../../hooks/useHideFiatForTestnet';

const ConfirmSubTitle = ({
  txData,
  hexTransactionAmount,
  subtitleComponent,
  assetStandard,
}) => {
  const { isNftTransfer } = useTransactionInfo(txData);
  const hideFiatForTestNet = useHideFiatForTestnet();

  if (
    hideFiatForTestNet &&
    !isNftTransfer &&
    !isNFTAssetStandard(assetStandard)
  ) {
    return null;
  }

  if (subtitleComponent) {
    return subtitleComponent;
  }

  return (
    <Text
      as="h5"
      ellipsis
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
  assetStandard: PropTypes.string,
  hexTransactionAmount: PropTypes.string,
  subtitleComponent: PropTypes.element,
  txData: PropTypes.object.isRequired,
};

export default ConfirmSubTitle;
